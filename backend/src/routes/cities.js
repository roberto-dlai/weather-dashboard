const express = require('express');
const router = express.Router();
const citiesController = require('../controllers/citiesController');

// GET /api/cities - Get all tracked cities
router.get('/', citiesController.getAllCities);

// POST /api/cities - Add a new city
router.post('/', citiesController.addCity);

// DELETE /api/cities/:id - Remove a city
router.delete('/:id', citiesController.deleteCity);

// GET /api/cities/:id - Get city details
router.get('/:id', citiesController.getCityById);

module.exports = router;
