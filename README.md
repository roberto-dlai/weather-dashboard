# Personal Weather Dashboard

A full-stack web application that automatically collects weather data from OpenWeatherMap API, stores historical records in SQLite, and provides interactive temperature trend visualizations with forecast integration.

## Features

- **Automated Weather Collection**: Hourly data collection via node-cron scheduler
- **Multi-City Tracking**: Track weather for multiple cities simultaneously
- **Historical Data Storage**: SQLite database with 30-day retention
- **Interactive Charts**: Temperature trends with Chart.js (actual vs forecast)
- **Forecast Integration**: 5-day forecast displayed as dashed lines
- **Responsive UI**: Beautiful purple gradient design, mobile-friendly
- **RESTful API**: Complete backend API for weather data access
- **Rate Limiting**: Protection against API abuse (60 req/min)
- **Caching**: 10-minute in-memory cache to reduce API calls
- **Metadata Tracking**: Success/failure tracking per city
- **Manual Collection**: CLI tool for on-demand weather updates

## Tech Stack

**Backend:**
- Node.js + Express.js
- SQLite (better-sqlite3) with WAL mode
- OpenWeatherMap API
- node-cron (scheduled tasks)
- axios (HTTP client)

**Frontend:**
- Vanilla JavaScript (no framework)
- Chart.js with date-fns adapter
- HTML5 + CSS3 (responsive design)

**Testing:**
- Jest (unit tests)
- Supertest (API tests)
- 45% test coverage on critical paths

## Prerequisites

- **Node.js** 18.x or 20.x LTS
- **npm** 8.x or higher
- **OpenWeatherMap API key** (free tier: 60 calls/min, 1M calls/month)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/roberto-dlai/weather-dashboard.git
cd weather-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get OpenWeatherMap API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Navigate to API Keys section
3. Copy your API key

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
OPENWEATHER_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
DB_PATH=./database/weather.db
```

### 5. Initialize Database

```bash
npm run init-db
```

This creates the SQLite database with the following tables:
- `cities` - Tracked city information
- `weather_records` - Historical weather data
- `collection_metadata` - Collection success/failure tracking
- `user_preferences` - Application settings

### 6. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The application will be available at **http://localhost:3000**

## Usage

### Web Interface

1. **Add a City**:
   - Enter city name (e.g., "London")
   - Enter state (optional, for US cities like "CA" for California)
   - Enter country code (e.g., "US", "GB")
   - Click "Add City"
   - Coordinates are automatically geocoded from the city name

2. **View Weather Data**:
   - Current weather displayed on city cards
   - Temperature, humidity, wind speed, pressure
   - Weather condition with emoji icons

3. **Collect Weather Data**:
   - Click "Collect Weather Data" button for manual collection
   - Or wait for automatic hourly collection

4. **View Temperature Trends**:
   - Chart displays 7-day window
   - Solid lines = historical actual data
   - Dashed lines = forecast data
   - Hover for detailed information

### CLI Tools

**Manual Weather Collection:**
```bash
npm run collect-weather
```

**Database Initialization:**
```bash
npm run init-db
```

**Run Tests:**
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## API Documentation

Base URL: `http://localhost:3000/api`

### Cities Endpoints

#### Get All Cities
```http
GET /api/cities
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "London",
      "country": "GB",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "date_added": "2025-12-04 12:00:00",
      "last_updated": "2025-12-04 12:00:00"
    }
  ]
}
```

#### Add City
```http
POST /api/cities
Content-Type: application/json

{
  "name": "London",
  "country": "GB",
  "latitude": 51.5074,
  "longitude": -0.1278
}
```

#### Get City by ID
```http
GET /api/cities/:id
```

#### Delete City
```http
DELETE /api/cities/:id
```

### Weather Endpoints

#### Get Current Weather
```http
GET /api/weather/current/:cityId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "temperature": 20.5,
      "feels_like": 18.3,
      "humidity": 65,
      "pressure": 1013,
      "wind_speed": 5.5,
      "weather_condition": "Clear",
      "weather_description": "clear sky",
      "timestamp": "2025-12-04T12:00:00.000Z"
    },
    "city": { ... }
  }
}
```

#### Get Historical Weather
```http
GET /api/weather/history/:cityId?days=7
```

#### Get 5-Day Forecast
```http
GET /api/weather/forecast/:cityId
```

#### Trigger Manual Collection
```http
POST /api/weather/collect
```

### Health Check
```http
GET /api/health
```

## Project Structure

```
weather-dashboard/
├── backend/
│   └── src/
│       ├── controllers/        # Request handlers
│       │   ├── citiesController.js
│       │   └── weatherController.js
│       ├── routes/            # API routes
│       │   ├── cities.js
│       │   └── weather.js
│       ├── services/          # Business logic
│       │   └── weatherService.js
│       ├── schedulers/        # Cron jobs
│       │   └── weatherCollector.js
│       ├── utils/             # Utilities
│       │   ├── db.js
│       │   ├── initDb.js
│       │   └── manualCollect.js
│       └── server.js          # Express app
├── database/
│   ├── schema.sql            # Database schema
│   └── weather.db            # SQLite database (gitignored)
├── frontend/
│   ├── css/
│   │   └── styles.css        # Responsive styles
│   ├── js/
│   │   ├── api.js           # API client wrapper
│   │   ├── app.js           # Main application logic
│   │   └── charts.js        # Chart.js visualization
│   └── index.html           # Main HTML page
├── tests/
│   ├── api.test.js          # API endpoint tests
│   ├── database.test.js     # Database operation tests
│   └── weather-service.test.js  # Weather service tests
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── jest.config.js          # Jest configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Scheduled Tasks

### Hourly Weather Collection
- **Schedule**: Every hour at minute 0 (UTC)
- **Cron**: `0 * * * *`
- **Action**: Fetches current weather for all tracked cities

### Weekly Database Cleanup
- **Schedule**: Sundays at 2:00 AM (UTC)
- **Cron**: `0 2 * * 0`
- **Action**: Deletes records older than 30 days, runs VACUUM

## Testing

The project uses Jest for testing with a minimal approach (40-50% coverage).

**Test Coverage:**
- Statements: 45.28%
- Branches: 49.05%
- Functions: 37.93%
- Lines: 45.25%

**What We Test:**
- Database CRUD operations
- API endpoint integration (supertest)
- Weather service with mocked axios
- Cache functionality
- Error handling

**Run Tests:**
```bash
npm test -- --coverage
```

View HTML coverage report:
```bash
open coverage/index.html
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | - | Required: Your OpenWeatherMap API key |
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `DB_PATH` | ./database/weather.db | SQLite database path |

### Rate Limiting

- **Weather endpoints**: 60 requests per minute
- **Cache TTL**: 10 minutes
- **City collection delay**: 1 second between cities

## Development

**Start development server:**
```bash
npm run dev
```

This runs the server with nodemon, automatically restarting on file changes.

**Database location:**
```bash
./database/weather.db
```

**View database:**
```bash
sqlite3 database/weather.db
```

## Deployment

See [deployment.md](deployment.md) for detailed deployment instructions including:
- Local deployment with PM2
- Cloud deployment (Render.com, Railway.app)
- Environment setup
- Database backups

## Troubleshooting

### API Key Issues
**Error**: "Invalid API key"
- Verify your API key in `.env`
- Ensure no extra spaces or quotes
- Check OpenWeatherMap dashboard for key status

### Database Locked
- Stop all running instances: `pkill -f "node backend/src/server.js"`
- WAL mode should prevent most locking issues

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Tests Failing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "[feat]: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Author

**roberto-dlai**
- GitHub: [@roberto-dlai](https://github.com/roberto-dlai)

## Acknowledgments

- OpenWeatherMap API for weather data
- Chart.js for visualizations
- better-sqlite3 for database management

---

Built with Claude Code
