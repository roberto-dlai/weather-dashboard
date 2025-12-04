/**
 * API Client for Weather Dashboard
 * Handles all communication with the backend API
 */

const API_BASE_URL = '/api';

class WeatherAPI {
  /**
   * Generic request handler with error handling
   */
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ==================== Cities Endpoints ====================

  /**
   * Get all tracked cities
   * @returns {Promise<Object>} { success: boolean, data: Array<City> }
   */
  async getCities() {
    return this.request('/cities');
  }

  /**
   * Add a new city
   * @param {Object} cityData - { name, country, latitude, longitude }
   * @returns {Promise<Object>} { success: boolean, data: { id, ...cityData } }
   */
  async addCity(cityData) {
    return this.request('/cities', {
      method: 'POST',
      body: JSON.stringify(cityData)
    });
  }

  /**
   * Get a specific city by ID
   * @param {number} cityId
   * @returns {Promise<Object>} { success: boolean, data: City }
   */
  async getCityById(cityId) {
    return this.request(`/cities/${cityId}`);
  }

  /**
   * Delete a city
   * @param {number} cityId
   * @returns {Promise<Object>} { success: boolean, message: string }
   */
  async deleteCity(cityId) {
    return this.request(`/cities/${cityId}`, {
      method: 'DELETE'
    });
  }

  // ==================== Weather Endpoints ====================

  /**
   * Get current weather for a city
   * @param {number} cityId
   * @returns {Promise<Object>} { success: boolean, data: { current, latest_record, city } }
   */
  async getCurrentWeather(cityId) {
    return this.request(`/weather/current/${cityId}`);
  }

  /**
   * Get historical weather data for a city
   * @param {number} cityId
   * @param {number} days - Number of days to retrieve (default: 7)
   * @returns {Promise<Object>} { success: boolean, data: Array<WeatherRecord> }
   */
  async getHistoricalWeather(cityId, days = 7) {
    return this.request(`/weather/history/${cityId}?days=${days}`);
  }

  /**
   * Get 5-day forecast for a city
   * @param {number} cityId
   * @returns {Promise<Object>} { success: boolean, data: Array<ForecastData> }
   */
  async getForecast(cityId) {
    return this.request(`/weather/forecast/${cityId}`);
  }

  /**
   * Manually trigger weather collection for all cities
   * @returns {Promise<Object>} { success: boolean, data: Array<CollectionResult> }
   */
  async collectWeather() {
    return this.request('/weather/collect', {
      method: 'POST'
    });
  }

  // ==================== Health Check ====================

  /**
   * Check API health status
   * @returns {Promise<Object>} { success: boolean, message: string }
   */
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const api = new WeatherAPI();
