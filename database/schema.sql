-- Drop tables if they exist (for development resets)
DROP TABLE IF EXISTS weather_records;
DROP TABLE IF EXISTS collection_metadata;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS cities;

-- Cities table: Tracks which cities we're monitoring
CREATE TABLE cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  date_added TEXT DEFAULT (datetime('now')),
  last_updated TEXT DEFAULT (datetime('now')),
  UNIQUE(name, country)  -- Prevent duplicate cities
);

-- Weather records: Historical weather data (both actual and forecast)
CREATE TABLE weather_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL,
  temperature REAL NOT NULL,        -- Celsius
  feels_like REAL,
  humidity INTEGER,                 -- Percentage
  pressure INTEGER,                 -- hPa
  wind_speed REAL,                  -- m/s
  weather_condition TEXT,           -- "Clear", "Clouds", "Rain", etc.
  weather_description TEXT,         -- "clear sky", "few clouds", etc.
  timestamp TEXT NOT NULL,          -- When this weather occurred/will occur
  is_forecast INTEGER DEFAULT 0,    -- 0 = actual collected data, 1 = forecast
  forecast_timestamp TEXT,          -- When forecast was generated (NULL for actual)
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Collection metadata: Track data collection health per city
CREATE TABLE collection_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL UNIQUE,
  first_collection_date TEXT,       -- When we started tracking this city
  total_records INTEGER DEFAULT 0,  -- Total actual (non-forecast) records
  last_successful_fetch TEXT,       -- Most recent successful API call
  last_failed_fetch TEXT,           -- Most recent failed API call
  consecutive_failures INTEGER DEFAULT 0,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- User preferences: Dashboard settings
CREATE TABLE user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX idx_weather_city_timestamp ON weather_records(city_id, timestamp);
CREATE INDEX idx_weather_is_forecast ON weather_records(is_forecast);
CREATE INDEX idx_collection_city ON collection_metadata(city_id);

-- Insert default preferences
INSERT INTO user_preferences (key, value) VALUES
  ('temperature_unit', 'celsius'),
  ('refresh_interval', '300000'),  -- 5 minutes in milliseconds
  ('data_retention_days', '30');
