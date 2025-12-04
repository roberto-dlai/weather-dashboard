const cron = require('node-cron');
const { getDb } = require('../utils/db');
const weatherService = require('../services/weatherService');

/**
 * Weather Collection Scheduler
 * Handles automated weather data collection and cleanup
 */

// Track scheduler state
let isCollecting = false;
let scheduledTasks = [];

/**
 * Collect weather data for all cities
 */
async function collectWeatherForAllCities() {
  // Prevent concurrent executions
  if (isCollecting) {
    console.log('[Scheduler] Collection already in progress, skipping...');
    return;
  }

  isCollecting = true;
  const startTime = Date.now();
  console.log(`\n[${new Date().toISOString()}] Starting scheduled weather collection...`);

  try {
    const db = getDb();
    const cities = db.prepare('SELECT * FROM cities').all();

    if (cities.length === 0) {
      console.log('[Scheduler] No cities to collect weather for');
      return;
    }

    console.log(`[Scheduler] Collecting weather for ${cities.length} cities...`);

    let successCount = 0;
    let failCount = 0;

    for (const city of cities) {
      try {
        // Fetch current weather from API
        const weatherData = await weatherService.getCurrentWeather(
          city.latitude,
          city.longitude
        );

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

        successCount++;
        console.log(`  ✓ ${city.name}: ${weatherData.temperature}°C, ${weatherData.weather_description}`);

        // Rate limiting: 1 second delay between cities
        if (cities.indexOf(city) < cities.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        failCount++;
        console.error(`  ✗ ${city.name}: ${error.message}`);

        // Update failure metadata
        db.prepare(
          `UPDATE collection_metadata
           SET last_failed_fetch = datetime('now'),
               consecutive_failures = consecutive_failures + 1
           WHERE city_id = ?`
        ).run(city.id);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Scheduler] Collection complete: ${successCount} succeeded, ${failCount} failed (${duration}s)\n`);

  } catch (error) {
    console.error('[Scheduler] Collection error:', error);
  } finally {
    isCollecting = false;
  }
}

/**
 * Clean up old weather records (older than 30 days)
 */
function cleanupOldRecords() {
  console.log(`\n[${new Date().toISOString()}] Starting database cleanup...`);

  try {
    const db = getDb();

    // Delete records older than 30 days
    const result = db.prepare(
      `DELETE FROM weather_records
       WHERE created_at < datetime('now', '-30 days')`
    ).run();

    console.log(`[Cleanup] Deleted ${result.changes} old records (>30 days)`);

    // Vacuum database to reclaim space
    db.prepare('VACUUM').run();
    console.log('[Cleanup] Database optimized\n');

  } catch (error) {
    console.error('[Cleanup] Error:', error);
  }
}

/**
 * Initialize and start all scheduled tasks
 */
function startScheduler() {
  console.log('\n=== Weather Collection Scheduler ===');

  // Hourly collection at minute 0 of every hour
  const hourlyTask = cron.schedule('0 * * * *', async () => {
    await collectWeatherForAllCities();
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  scheduledTasks.push(hourlyTask);
  console.log('✓ Hourly collection scheduled: Every hour at minute 0 (UTC)');

  // Weekly cleanup on Sundays at 2 AM UTC
  const weeklyTask = cron.schedule('0 2 * * 0', () => {
    cleanupOldRecords();
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  scheduledTasks.push(weeklyTask);
  console.log('✓ Weekly cleanup scheduled: Sundays at 2:00 AM (UTC)');

  // Initial collection on startup
  console.log('✓ Running initial collection...\n');
  setTimeout(async () => {
    await collectWeatherForAllCities();
  }, 2000); // 2 second delay to ensure server is ready

  console.log('=== Scheduler started successfully ===\n');
}

/**
 * Stop all scheduled tasks gracefully
 */
function stopScheduler() {
  console.log('\n[Scheduler] Stopping all scheduled tasks...');

  scheduledTasks.forEach(task => {
    task.stop();
  });

  scheduledTasks = [];
  console.log('[Scheduler] All tasks stopped');
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  process.on('SIGINT', () => {
    console.log('\n[Scheduler] Received SIGINT, shutting down gracefully...');
    stopScheduler();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Scheduler] Received SIGTERM, shutting down gracefully...');
    stopScheduler();
    process.exit(0);
  });
}

module.exports = {
  startScheduler,
  stopScheduler,
  collectWeatherForAllCities,
  cleanupOldRecords,
  setupGracefulShutdown
};
