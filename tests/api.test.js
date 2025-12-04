const request = require('supertest');
const app = require('../backend/src/server');
const { initializeDatabase } = require('../backend/src/utils/initDb');
const { getDb, closeDb } = require('../backend/src/utils/db');
const fs = require('fs');

// Use test database
process.env.DB_PATH = './database/test-api.db';

describe('API Endpoints', () => {
  beforeAll(() => {
    initializeDatabase();
  });

  afterAll(() => {
    closeDb();
    if (fs.existsSync(process.env.DB_PATH)) {
      fs.unlinkSync(process.env.DB_PATH);
    }
  });

  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM weather_records').run();
    db.prepare('DELETE FROM collection_metadata').run();
    db.prepare('DELETE FROM cities').run();
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('cities');
    });
  });

  describe('POST /api/cities', () => {
    test('should add a new city', async () => {
      const cityData = {
        name: 'London',
        country: 'GB',
        latitude: 51.5074,
        longitude: -0.1278
      };

      const response = await request(app)
        .post('/api/cities')
        .send(cityData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'London',
        country: 'GB'
      });
    });

    test('should reject duplicate city', async () => {
      const cityData = {
        name: 'Paris',
        country: 'FR',
        latitude: 48.8566,
        longitude: 2.3522
      };

      await request(app).post('/api/cities').send(cityData);
      const response = await request(app).post('/api/cities').send(cityData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/cities')
        .send({ name: 'Berlin' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/cities', () => {
    test('should return all cities', async () => {
      // Add test cities
      await request(app).post('/api/cities').send({
        name: 'Tokyo',
        country: 'JP',
        latitude: 35.6762,
        longitude: 139.6503
      });

      const response = await request(app).get('/api/cities');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /api/cities/:id', () => {
    test('should delete a city', async () => {
      const addResponse = await request(app).post('/api/cities').send({
        name: 'Berlin',
        country: 'DE',
        latitude: 52.5200,
        longitude: 13.4050
      });

      const cityId = addResponse.body.data.id;

      const deleteResponse = await request(app).delete(`/api/cities/${cityId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });

    test('should return 404 for non-existent city', async () => {
      const response = await request(app).delete('/api/cities/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
