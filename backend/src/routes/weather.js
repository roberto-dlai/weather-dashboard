const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const weatherController = require('../controllers/weatherController');

// Rate limiting for weather endpoints
const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 60,              // 60 requests per minute
  message: { success: false, error: 'Too many requests, please try again later' }
});

router.use(limiter);

// GET /api/weather/current/:cityId - Get current weather
router.get('/current/:cityId', weatherController.getCurrentWeather);

// GET /api/weather/history/:cityId - Get historical data
router.get('/history/:cityId', weatherController.getHistoricalWeather);

// GET /api/weather/forecast/:cityId - Get forecast data
router.get('/forecast/:cityId', weatherController.getForecast);

// POST /api/weather/collect - Manually trigger collection
router.post('/collect', weatherController.collectWeather);

module.exports = router;
