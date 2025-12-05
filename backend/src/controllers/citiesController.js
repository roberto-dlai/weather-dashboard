const { getDb } = require('../utils/db');
const { geocodeCity } = require('../services/weatherService');

/**
 * Get all tracked cities
 */
function getAllCities(req, res) {
  try {
    const db = getDb();
    const cities = db.prepare(
      'SELECT * FROM cities ORDER BY date_added DESC'
    ).all();

    res.json({ success: true, data: cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get city by ID
 */
function getCityById(req, res) {
  try {
    const db = getDb();
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(req.params.id);

    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    res.json({ success: true, data: city });
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Add a new city to track
 * Now uses geocoding - only requires city name, optional state, and country
 */
async function addCity(req, res) {
  try {
    const { name, state, country } = req.body;

    // Validation
    if (!name || !country) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and country (state is optional)'
      });
    }

    const db = getDb();

    // Check if city already exists
    const existing = db.prepare(
      'SELECT id FROM cities WHERE name = ? AND country = ?'
    ).get(name, country);

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'City already exists',
        data: existing
      });
    }

    // Geocode the city to get coordinates
    console.log(`Geocoding: ${name}${state ? ', ' + state : ''}, ${country}`);
    const geoResult = await geocodeCity(name, state, country);

    console.log(`Geocoded: ${geoResult.name} at ${geoResult.lat}, ${geoResult.lon}`);

    // Insert city with geocoded coordinates
    const result = db.prepare(
      'INSERT INTO cities (name, country, latitude, longitude) VALUES (?, ?, ?, ?)'
    ).run(geoResult.name, geoResult.country, geoResult.lat, geoResult.lon);

    // Initialize collection metadata
    db.prepare(
      "INSERT INTO collection_metadata (city_id, first_collection_date) VALUES (?, datetime('now'))"
    ).run(result.lastInsertRowid);

    // Fetch created city
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: city,
      message: `City added: ${geoResult.name} (${geoResult.lat}, ${geoResult.lon})`
    });

  } catch (error) {
    console.error('Error adding city:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Delete a city
 */
function deleteCity(req, res) {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM cities WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    res.json({ success: true, message: 'City deleted successfully' });

  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllCities,
  getCityById,
  addCity,
  deleteCity
};
