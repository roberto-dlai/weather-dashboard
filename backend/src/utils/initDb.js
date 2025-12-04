const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './database/weather.db';
const SCHEMA_PATH = path.join(__dirname, '../../../database/schema.sql');

function initializeDatabase() {
  try {
    console.log('Initializing database...');
    console.log('Database path:', DB_PATH);

    // Ensure database directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Read schema file
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

    // Create database and execute schema
    const db = new Database(DB_PATH);
    db.exec(schema);

    console.log('✅ Database initialized successfully!');
    console.log('Tables created:');

    // Verify tables were created
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();

    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });

    db.close();

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
