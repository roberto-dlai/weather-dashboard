const { getDb, closeDb } = require('../backend/src/utils/db');
const { initializeDatabase } = require('../backend/src/utils/initDb');
const fs = require('fs');

// Use test database
process.env.DB_PATH = './database/test-weather.db';

describe('Database Operations', () => {
  beforeAll(() => {
    // Initialize test database
    initializeDatabase();
  });

  afterAll(() => {
    // Clean up test database
    closeDb();
    if (fs.existsSync(process.env.DB_PATH)) {
      fs.unlinkSync(process.env.DB_PATH);
    }
  });

  beforeEach(() => {
    // Clear data before each test
    const db = getDb();
    db.prepare('DELETE FROM weather_records').run();
    db.prepare('DELETE FROM collection_metadata').run();
    db.prepare('DELETE FROM cities').run();
  });

  test('should insert and retrieve a city', () => {
    const db = getDb();

    const insert = db.prepare(
      'INSERT INTO cities (name, country, latitude, longitude) VALUES (?, ?, ?, ?)'
    );
    const result = insert.run('London', 'GB', 51.5074, -0.1278);

    expect(result.changes).toBe(1);

    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(result.lastInsertRowid);

    expect(city.name).toBe('London');
    expect(city.country).toBe('GB');
    expect(city.latitude).toBe(51.5074);
  });

  test('should prevent duplicate cities', () => {
    const db = getDb();

    const insert = db.prepare(
      'INSERT INTO cities (name, country, latitude, longitude) VALUES (?, ?, ?, ?)'
    );

    insert.run('Paris', 'FR', 48.8566, 2.3522);

    // Try to insert duplicate
    expect(() => {
      insert.run('Paris', 'FR', 48.8566, 2.3522);
    }).toThrow();
  });

  test('should insert weather record with forecast flag', () => {
    const db = getDb();

    // Insert city first
    const cityResult = db.prepare(
      'INSERT INTO cities (name, country, latitude, longitude) VALUES (?, ?, ?, ?)'
    ).run('Berlin', 'DE', 52.5200, 13.4050);

    const cityId = cityResult.lastInsertRowid;

    // Insert forecast weather record
    const weatherResult = db.prepare(
      `INSERT INTO weather_records
       (city_id, temperature, humidity, weather_condition, timestamp, is_forecast, forecast_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(cityId, 15.5, 65, 'Clear', '2025-12-04T12:00:00Z', 1, '2025-12-03T10:00:00Z');

    expect(weatherResult.changes).toBe(1);

    const record = db.prepare('SELECT * FROM weather_records WHERE id = ?').get(weatherResult.lastInsertRowid);

    expect(record.temperature).toBe(15.5);
    expect(record.is_forecast).toBe(1);
  });

  test('should delete city and cascade delete weather records', () => {
    const db = getDb();

    // Insert city
    const cityResult = db.prepare(
      'INSERT INTO cities (name, country, latitude, longitude) VALUES (?, ?, ?, ?)'
    ).run('Tokyo', 'JP', 35.6762, 139.6503);

    const cityId = cityResult.lastInsertRowid;

    // Insert weather records
    db.prepare(
      'INSERT INTO weather_records (city_id, temperature, humidity, weather_condition, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run(cityId, 20.0, 70, 'Clouds', '2025-12-03T10:00:00Z');

    // Verify record exists
    let records = db.prepare('SELECT * FROM weather_records WHERE city_id = ?').all(cityId);
    expect(records.length).toBe(1);

    // Delete city
    db.prepare('DELETE FROM cities WHERE id = ?').run(cityId);

    // Verify weather records were cascade deleted
    records = db.prepare('SELECT * FROM weather_records WHERE city_id = ?').all(cityId);
    expect(records.length).toBe(0);
  });
});
