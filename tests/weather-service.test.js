const weatherService = require('../backend/src/services/weatherService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Weather Service', () => {
  beforeEach(() => {
    weatherService.clearCache();
    jest.clearAllMocks();
  });

  describe('getCurrentWeather', () => {
    test('should fetch current weather successfully', async () => {
      const mockResponse = {
        data: {
          main: {
            temp: 20.5,
            feels_like: 18.3,
            humidity: 65,
            pressure: 1013
          },
          weather: [
            {
              main: 'Clear',
              description: 'clear sky'
            }
          ],
          wind: {
            speed: 5.5
          },
          dt: 1701619200  // Unix timestamp
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await weatherService.getCurrentWeather(51.5074, -0.1278);

      expect(result).toMatchObject({
        temperature: 20.5,
        feels_like: 18.3,
        humidity: 65,
        weather_condition: 'Clear',
        weather_description: 'clear sky'
      });

      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    test('should use cache for duplicate requests', async () => {
      const mockResponse = {
        data: {
          main: { temp: 20.5, feels_like: 18.3, humidity: 65, pressure: 1013 },
          weather: [{ main: 'Clear', description: 'clear sky' }],
          wind: { speed: 5.5 },
          dt: 1701619200
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // First call
      await weatherService.getCurrentWeather(51.5074, -0.1278);

      // Second call (should use cache)
      await weatherService.getCurrentWeather(51.5074, -0.1278);

      expect(axios.get).toHaveBeenCalledTimes(1);  // Only called once
    });

    test('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid API key' }
        }
      });

      await expect(
        weatherService.getCurrentWeather(51.5074, -0.1278)
      ).rejects.toThrow('OpenWeatherMap API error');
    });

    test('should handle network errors', async () => {
      axios.get.mockRejectedValue({
        request: {}
      });

      await expect(
        weatherService.getCurrentWeather(51.5074, -0.1278)
      ).rejects.toThrow('Network error');
    });
  });

  describe('getForecast', () => {
    test('should fetch forecast successfully', async () => {
      const mockResponse = {
        data: {
          list: [
            {
              main: { temp: 18.0, feels_like: 16.5, humidity: 70, pressure: 1010 },
              weather: [{ main: 'Clouds', description: 'few clouds' }],
              wind: { speed: 4.2 },
              dt: 1701619200
            },
            {
              main: { temp: 19.5, feels_like: 17.8, humidity: 68, pressure: 1011 },
              weather: [{ main: 'Clear', description: 'clear sky' }],
              wind: { speed: 3.8 },
              dt: 1701630000
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await weatherService.getForecast(48.8566, 2.3522);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        temperature: 18.0,
        weather_condition: 'Clouds'
      });
    });
  });
});
