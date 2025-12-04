/**
 * Main Application Logic for Weather Dashboard
 */

// State management
const state = {
  cities: [],
  lastUpdate: null,
  isLoading: false
};

// DOM elements
const elements = {
  addCityForm: null,
  citiesGrid: null,
  noCities: null,
  loading: null,
  errorMessage: null,
  lastUpdate: null,
  refreshBtn: null,
  collectBtn: null
};

/**
 * Initialize the application
 */
async function init() {
  // Cache DOM elements
  elements.addCityForm = document.getElementById('add-city-form');
  elements.citiesGrid = document.getElementById('cities-grid');
  elements.noCities = document.getElementById('no-cities');
  elements.loading = document.getElementById('loading');
  elements.errorMessage = document.getElementById('error-message');
  elements.lastUpdate = document.getElementById('last-update');
  elements.refreshBtn = document.getElementById('refresh-btn');
  elements.collectBtn = document.getElementById('collect-btn');

  // Setup event listeners
  setupEventListeners();

  // Load initial data
  await loadCities();

  // Setup auto-refresh every 5 minutes
  setInterval(loadCities, 5 * 60 * 1000);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Add city form
  elements.addCityForm.addEventListener('submit', handleAddCity);

  // Control buttons
  elements.refreshBtn.addEventListener('click', handleRefresh);
  elements.collectBtn.addEventListener('click', handleCollect);
}

/**
 * Load all cities and their current weather
 */
async function loadCities() {
  try {
    showLoading(true);
    hideError();

    const response = await api.getCities();

    if (response.success) {
      state.cities = response.data;
      state.lastUpdate = new Date();

      // Load current weather for each city
      await loadWeatherForCities();

      renderCities();
      updateLastUpdateTime();
    }
  } catch (error) {
    showError(`Failed to load cities: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Load current weather for all cities
 */
async function loadWeatherForCities() {
  const weatherPromises = state.cities.map(async (city) => {
    try {
      const response = await api.getCurrentWeather(city.id);
      if (response.success) {
        city.weather = response.data.current;
        city.latest_record = response.data.latest_record;
      }
    } catch (error) {
      console.error(`Failed to load weather for ${city.name}:`, error);
      city.weather = null;
    }
  });

  await Promise.all(weatherPromises);
}

/**
 * Render all city cards
 */
function renderCities() {
  if (state.cities.length === 0) {
    elements.citiesGrid.innerHTML = '';
    elements.noCities.style.display = 'block';
    return;
  }

  elements.noCities.style.display = 'none';
  elements.citiesGrid.innerHTML = state.cities.map(city => createCityCard(city)).join('');

  // Attach delete button listeners
  document.querySelectorAll('.delete-city-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cityId = parseInt(e.target.dataset.cityId);
      handleDeleteCity(cityId);
    });
  });
}

/**
 * Create HTML for a city card
 */
function createCityCard(city) {
  const weather = city.weather;

  if (!weather) {
    return `
      <div class="city-card">
        <div class="city-card-header">
          <div>
            <div class="city-name">${city.name}</div>
            <div class="city-country">${city.country}</div>
          </div>
        </div>
        <p style="margin-top: 20px; opacity: 0.8;">Loading weather data...</p>
        <div class="card-actions">
          <button class="btn btn-danger delete-city-btn" data-city-id="${city.id}">Delete</button>
        </div>
      </div>
    `;
  }

  const weatherIcon = getWeatherIcon(weather.weather_condition);
  const temperature = Math.round(weather.temperature);
  const feelsLike = Math.round(weather.feels_like);

  // Format timestamp
  const timestamp = new Date(weather.timestamp);
  const timeAgo = getTimeAgo(timestamp);

  return `
    <div class="city-card">
      <div class="city-card-header">
        <div>
          <div class="city-name">${city.name}</div>
          <div class="city-country">${city.country}</div>
        </div>
        <div class="weather-icon">${weatherIcon}</div>
      </div>

      <div class="temperature">${temperature}°C</div>

      <div style="margin-bottom: 10px; opacity: 0.9;">
        ${weather.weather_description}
      </div>

      <div class="weather-details">
        <div class="detail-item">
          <span>💨 Wind:</span>
          <span>${weather.wind_speed} m/s</span>
        </div>
        <div class="detail-item">
          <span>💧 Humidity:</span>
          <span>${weather.humidity}%</span>
        </div>
        <div class="detail-item">
          <span>🌡️ Feels like:</span>
          <span>${feelsLike}°C</span>
        </div>
        <div class="detail-item">
          <span>🎚️ Pressure:</span>
          <span>${weather.pressure} hPa</span>
        </div>
      </div>

      <div class="data-info">
        Updated ${timeAgo}
      </div>

      <div class="card-actions">
        <button class="btn btn-danger delete-city-btn" data-city-id="${city.id}">Delete</button>
      </div>
    </div>
  `;
}

/**
 * Get weather icon emoji based on condition
 */
function getWeatherIcon(condition) {
  const icons = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️'
  };

  return icons[condition] || '🌤️';
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Handle add city form submission
 */
async function handleAddCity(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('city-name').value.trim(),
    country: document.getElementById('country-code').value.trim().toUpperCase(),
    latitude: parseFloat(document.getElementById('latitude').value),
    longitude: parseFloat(document.getElementById('longitude').value)
  };

  try {
    showLoading(true);
    hideError();

    const response = await api.addCity(formData);

    if (response.success) {
      // Clear form
      elements.addCityForm.reset();

      // Reload cities
      await loadCities();

      showSuccess(`Successfully added ${formData.name}!`);
    }
  } catch (error) {
    showError(`Failed to add city: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Handle delete city
 */
async function handleDeleteCity(cityId) {
  const city = state.cities.find(c => c.id === cityId);

  if (!confirm(`Are you sure you want to delete ${city.name}? This will also delete all associated weather data.`)) {
    return;
  }

  try {
    showLoading(true);
    hideError();

    const response = await api.deleteCity(cityId);

    if (response.success) {
      await loadCities();
      showSuccess(`Successfully deleted ${city.name}!`);
    }
  } catch (error) {
    showError(`Failed to delete city: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Handle refresh all button
 */
async function handleRefresh() {
  await loadCities();
  showSuccess('Refreshed all cities!');
}

/**
 * Handle collect weather button
 */
async function handleCollect() {
  try {
    showLoading(true);
    hideError();

    const response = await api.collectWeather();

    if (response.success) {
      const results = response.data;
      const successCount = results.filter(r => r.status === 'success').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      let message = `Collected weather for ${successCount} cit${successCount !== 1 ? 'ies' : 'y'}`;
      if (failCount > 0) {
        message += `, ${failCount} failed`;
      }

      await loadCities();
      showSuccess(message);
    }
  } catch (error) {
    showError(`Failed to collect weather: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
  state.isLoading = show;
  elements.loading.style.display = show ? 'block' : 'none';

  // Disable buttons while loading
  elements.refreshBtn.disabled = show;
  elements.collectBtn.disabled = show;
}

/**
 * Show error message
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(hideError, 5000);
}

/**
 * Hide error message
 */
function hideError() {
  elements.errorMessage.style.display = 'none';
}

/**
 * Show success message (using error element with different styling)
 */
function showSuccess(message) {
  elements.errorMessage.textContent = `✓ ${message}`;
  elements.errorMessage.style.background = '#e8f5e9';
  elements.errorMessage.style.color = '#2e7d32';
  elements.errorMessage.style.borderLeft = '4px solid #4caf50';
  elements.errorMessage.style.display = 'block';

  // Reset styling and hide after 3 seconds
  setTimeout(() => {
    hideError();
    // Reset to error styling
    elements.errorMessage.style.background = '#ffebee';
    elements.errorMessage.style.color = '#c62828';
    elements.errorMessage.style.borderLeft = '4px solid #ef5350';
  }, 3000);
}

/**
 * Update last update time display
 */
function updateLastUpdateTime() {
  if (state.lastUpdate) {
    const timeString = state.lastUpdate.toLocaleTimeString();
    elements.lastUpdate.textContent = `Last updated: ${timeString}`;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
