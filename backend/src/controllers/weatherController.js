const { getDb } = require('../utils/db');
const weatherService = require('../services/weatherService');

/**
 * Get current weather for a city (from API + latest DB record)
 */
async function getCurrentWeather(req, res) {
  try {
    const { cityId } = req.params;
    const db = getDb();

    // Get city details
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    // Fetch from API
    const weatherData = await weatherService.getCurrentWeather(city.latitude, city.longitude);

    // Get latest DB record for comparison
    const latestRecord = db.prepare(
      'SELECT * FROM weather_records WHERE city_id = ? AND is_forecast = 0 ORDER BY timestamp DESC LIMIT 1'
    ).get(cityId);

    res.json({
      success: true,
      data: {
        current: weatherData,
        latest_record: latestRecord,
        city: city
      }
    });

  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get historical weather data for a city
 */
function getHistoricalWeather(req, res) {
  try {
    const { cityId } = req.params;
    const { days = 7 } = req.query;  // Default 7 days

    const db = getDb();

    const records = db.prepare(
      `SELECT * FROM weather_records
       WHERE city_id = ?
       AND is_forecast = 0
       AND timestamp >= datetime('now', '-' || ? || ' days')
       ORDER BY timestamp ASC`
    ).all(cityId, days);

    res.json({ success: true, data: records });

  } catch (error) {
    console.error('Error fetching historical weather:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get forecast data for a city
 */
async function getForecast(req, res) {
  try {
    const { cityId } = req.params;
    const db = getDb();

    // Get city details
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    // Fetch forecast from API
    const forecast = await weatherService.getForecast(city.latitude, city.longitude);

    res.json({ success: true, data: forecast });

  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Manually trigger weather collection for all cities
 */
async function collectWeather(req, res) {
  try {
    const db = getDb();
    const cities = db.prepare('SELECT * FROM cities').all();

    if (cities.length === 0) {
      return res.json({ success: true, message: 'No cities to collect weather for' });
    }

    const results = [];

    for (const city of cities) {
      try {
        const weatherData = await weatherService.getCurrentWeather(city.latitude, city.longitude);

        // Insert into database
        db.prepare(
          `INSERT INTO weather_records
           (city_id, temperature, feels_like, humidity, pressure, wind_speed,
            weather_condition, weather_description, timestamp, is_forecast)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
        ).run(
          city.id,
          weatherData.temperature,
          weatherData.feels_like,
          weatherData.humidity,
          weatherData.pressure,
          weatherData.wind_speed,
          weatherData.weather_condition,
          weatherData.weather_description,
          weatherData.timestamp
        );

        // Update collection metadata
        db.prepare(
          `UPDATE collection_metadata
           SET last_successful_fetch = datetime('now'),
               total_records = total_records + 1,
               consecutive_failures = 0
           WHERE city_id = ?`
        ).run(city.id);

        results.push({ city: city.name, status: 'success' });

      } catch (error) {
        console.error(`Failed to collect weather for ${city.name}:`, error);

        // Update failure metadata
        db.prepare(
          `UPDATE collection_metadata
           SET last_failed_fetch = datetime('now'),
               consecutive_failures = consecutive_failures + 1
           WHERE city_id = ?`
        ).run(city.id);

        results.push({ city: city.name, status: 'failed', error: error.message });
      }
    }

    res.json({ success: true, data: results });

  } catch (error) {
    console.error('Error collecting weather:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getCurrentWeather,
  getHistoricalWeather,
  getForecast,
  collectWeather
};
