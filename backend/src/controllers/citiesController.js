const { getDb } = require('../utils/db');

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
 */
function addCity(req, res) {
  try {
    const { name, country, latitude, longitude } = req.body;

    // Validation
    if (!name || !country || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, country, latitude, longitude'
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

    // Insert city
    const result = db.prepare(
      'INSERT INTO cities (name, country, latitude, longitude) VALUES (?, ?, ?, ?)'
    ).run(name, country, latitude, longitude);

    // Initialize collection metadata
    db.prepare(
      "INSERT INTO collection_metadata (city_id, first_collection_date) VALUES (?, datetime('now'))"
    ).run(result.lastInsertRowid);

    // Fetch created city
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: city });

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
