const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Simple in-memory cache (10-minute TTL)
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;  // 10 minutes

/**
 * Fetch current weather for a city
 */
async function getCurrentWeather(lat, lon) {
  const cacheKey = `current_${lat}_${lon}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Returning cached weather data');
    return cached.data;
  }

  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    console.log('Fetching current weather from OpenWeatherMap...');

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    const weatherData = {
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_speed: data.wind.speed,
      weather_condition: data.weather[0].main,
      weather_description: data.weather[0].description,
      timestamp: new Date(data.dt * 1000).toISOString()
    };

    // Cache result
    cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    return weatherData;

  } catch (error) {
    if (error.response) {
      // API error
      throw new Error(`OpenWeatherMap API error: ${error.response.status} - ${error.response.data.message}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error: Unable to reach OpenWeatherMap API');
    } else {
      throw error;
    }
  }
}

/**
 * Fetch 5-day forecast for a city (3-hour intervals)
 */
async function getForecast(lat, lon) {
  const cacheKey = `forecast_${lat}_${lon}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Returning cached forecast data');
    return cached.data;
  }

  try {
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    console.log('Fetching forecast from OpenWeatherMap...');

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    // Transform forecast list
    const forecast = data.list.map(item => ({
      temperature: item.main.temp,
      feels_like: item.main.feels_like,
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      wind_speed: item.wind.speed,
      weather_condition: item.weather[0].main,
      weather_description: item.weather[0].description,
      timestamp: new Date(item.dt * 1000).toISOString(),
      forecast_timestamp: new Date().toISOString()
    }));

    // Cache result
    cache.set(cacheKey, {
      data: forecast,
      timestamp: Date.now()
    });

    return forecast;

  } catch (error) {
    if (error.response) {
      throw new Error(`OpenWeatherMap API error: ${error.response.status} - ${error.response.data.message}`);
    } else if (error.request) {
      throw new Error('Network error: Unable to reach OpenWeatherMap API');
    } else {
      throw error;
    }
  }
}

/**
 * Clear cache (for testing)
 */
function clearCache() {
  cache.clear();
}

module.exports = {
  getCurrentWeather,
  getForecast,
  clearCache
};
