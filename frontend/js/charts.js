/**
 * Chart.js Visualization for Weather Dashboard
 * Handles temperature trend charts with forecast integration
 */

// Chart instances
let temperatureChart = null;

// Color palette for cities
const CITY_COLORS = [
  { border: 'rgba(102, 126, 234, 1)', background: 'rgba(102, 126, 234, 0.1)' },
  { border: 'rgba(118, 75, 162, 1)', background: 'rgba(118, 75, 162, 0.1)' },
  { border: 'rgba(239, 83, 80, 1)', background: 'rgba(239, 83, 80, 0.1)' },
  { border: 'rgba(76, 175, 80, 1)', background: 'rgba(76, 175, 80, 0.1)' },
  { border: 'rgba(255, 193, 7, 1)', background: 'rgba(255, 193, 7, 0.1)' },
  { border: 'rgba(33, 150, 243, 1)', background: 'rgba(33, 150, 243, 0.1)' },
  { border: 'rgba(156, 39, 176, 1)', background: 'rgba(156, 39, 176, 0.1)' },
  { border: 'rgba(255, 152, 0, 1)', background: 'rgba(255, 152, 0, 0.1)' }
];

/**
 * Initialize all charts
 */
async function initCharts() {
  await renderTemperatureChart();
}

/**
 * Render temperature trend chart for all cities
 */
async function renderTemperatureChart() {
  try {
    if (state.cities.length === 0) {
      hideChart();
      return;
    }

    // Fetch historical and forecast data for all cities
    const chartData = await prepareTemperatureData();

    if (chartData.datasets.length === 0) {
      hideChart();
      return;
    }

    // Show chart container
    showChart();

    // Get or create canvas
    const ctx = document.getElementById('temperature-chart');
    if (!ctx) {
      console.error('Temperature chart canvas not found');
      return;
    }

    // Destroy existing chart if it exists
    if (temperatureChart) {
      temperatureChart.destroy();
    }

    // Create new chart
    temperatureChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: 'Temperature Trends (7 Days)',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y.toFixed(1) + '°C';

                // Add "(forecast)" indicator for forecast data
                const dataPoint = context.dataset.data[context.dataIndex];
                if (dataPoint && dataPoint.isForecast) {
                  label += ' (forecast)';
                }

                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'hour',
              displayFormats: {
                hour: 'MMM d, HH:mm',
                day: 'MMM d'
              },
              tooltipFormat: 'PPpp'
            },
            title: {
              display: true,
              text: 'Time'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            title: {
              display: true,
              text: 'Temperature (°C)'
            },
            ticks: {
              callback: function(value) {
                return value + '°C';
              }
            }
          }
        }
      }
    });

  } catch (error) {
    console.error('Error rendering temperature chart:', error);
  }
}

/**
 * Prepare temperature data for chart
 * Combines historical and forecast data for each city
 */
async function prepareTemperatureData() {
  const datasets = [];
  const DAYS_TO_SHOW = 7;

  for (let i = 0; i < state.cities.length; i++) {
    const city = state.cities[i];
    const color = CITY_COLORS[i % CITY_COLORS.length];

    try {
      // Fetch historical data (last 7 days)
      const historicalResponse = await api.getHistoricalWeather(city.id, DAYS_TO_SHOW);
      const historicalData = historicalResponse.success ? historicalResponse.data : [];

      // Fetch forecast data
      const forecastResponse = await api.getForecast(city.id);
      const forecastData = forecastResponse.success ? forecastResponse.data : [];

      // Combine historical and forecast data
      const combinedData = [];

      // Add historical data (solid line, larger points)
      historicalData.forEach(record => {
        combinedData.push({
          x: new Date(record.timestamp),
          y: record.temperature,
          isForecast: false
        });
      });

      // Add forecast data (dashed line, smaller points)
      // Only add forecasts that are in the future or recent
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      forecastData.forEach(forecast => {
        const forecastDate = new Date(forecast.timestamp);
        // Only include forecasts within the 7-day window
        if (forecastDate <= sevenDaysFromNow) {
          combinedData.push({
            x: forecastDate,
            y: forecast.temperature,
            isForecast: true
          });
        }
      });

      // Sort by timestamp
      combinedData.sort((a, b) => a.x - b.x);

      // Separate into historical and forecast datasets for different styling
      const historicalPoints = combinedData.filter(d => !d.isForecast);
      const forecastPoints = combinedData.filter(d => d.isForecast);

      // Add historical dataset (solid line)
      if (historicalPoints.length > 0) {
        datasets.push({
          label: `${city.name} (actual)`,
          data: historicalPoints,
          borderColor: color.border,
          backgroundColor: color.background,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [],  // Solid line
          tension: 0.1,
          fill: false
        });
      }

      // Add forecast dataset (dashed line)
      if (forecastPoints.length > 0) {
        // If we have historical data, connect the last historical point to first forecast
        const connectionPoint = historicalPoints.length > 0
          ? [historicalPoints[historicalPoints.length - 1]]
          : [];

        datasets.push({
          label: `${city.name} (forecast)`,
          data: [...connectionPoint, ...forecastPoints],
          borderColor: color.border,
          backgroundColor: color.background,
          borderWidth: 2,
          pointRadius: 2,  // Smaller points for forecast
          pointHoverRadius: 4,
          borderDash: [5, 5],  // Dashed line
          tension: 0.1,
          fill: false,
          opacity: 0.7
        });
      }

    } catch (error) {
      console.error(`Failed to prepare chart data for ${city.name}:`, error);
    }
  }

  return { datasets };
}

/**
 * Show chart container
 */
function showChart() {
  const container = document.getElementById('charts-container');
  if (container) {
    container.innerHTML = `
      <div class="chart-wrapper">
        <canvas id="temperature-chart"></canvas>
      </div>
    `;
  }
}

/**
 * Hide chart container
 */
function hideChart() {
  const container = document.getElementById('charts-container');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        <p>Add cities and collect weather data to see temperature trends</p>
      </div>
    `;
  }
}

/**
 * Refresh charts (called when cities are updated)
 */
async function refreshCharts() {
  await renderTemperatureChart();
}

// Export functions for use in app.js
window.chartFunctions = {
  initCharts,
  refreshCharts
};
