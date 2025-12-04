#!/usr/bin/env node

/**
 * Manual Weather Collection Script
 * Run: npm run collect-weather
 *
 * This script manually triggers weather collection for all cities
 * without starting the full server or scheduler.
 */

require('dotenv').config();
const { collectWeatherForAllCities } = require('../schedulers/weatherCollector');

console.log('\n╔════════════════════════════════════════╗');
console.log('║  Manual Weather Collection Tool       ║');
console.log('╚════════════════════════════════════════╝\n');

// Run collection
(async () => {
  try {
    await collectWeatherForAllCities();
    console.log('✓ Manual collection completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('✗ Manual collection failed:', error.message);
    process.exit(1);
  }
})();
