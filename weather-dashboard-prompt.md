# Personal Weather Dashboard - Claude Code Project Prompt

## Prerequisites

### Required Knowledge
- **JavaScript**: ES6+ syntax, async/await, promises, array methods
- **HTML/CSS**: Basic structure and styling
- **SQL**: Basic queries (SELECT, INSERT, UPDATE)
- **Git**: Basic commands (add, commit, push, pull)
- **Command Line**: Navigation, running commands, file operations

### Required Tools
- **Node.js**: Version 18.x LTS or 20.x LTS (recommended: latest LTS)
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: Version 2.x or higher
- **Code Editor**: VS Code recommended
- **Browser**: Chrome/Firefox/Edge (modern version)

### Optional Knowledge
- Testing concepts (if choosing Option B)
- Basic understanding of cron syntax
- RESTful API concepts

## Project: Personal Weather Dashboard Web Application

Create a full-stack web application that collects weather data from free APIs, stores it in a database, and provides interactive visualizations. This is a learning project to understand API integration, database management, and data visualization.

**Important Note on Historical Data:**
- OpenWeatherMap's free tier does NOT provide historical weather data
- This app builds its own historical dataset by collecting current weather every hour
- Charts and trends will only show data collected since the app started running
- After 7 days of continuous operation, you'll have a full week of historical data
- This approach teaches real-world data collection and persistence strategies

## Database Technology Choice

**Why SQLite for This Project:**
- **Simplicity**: No separate database server to install or manage - perfect for learning
- **Portability**: Single file database that can be easily backed up or moved
- **Sufficient for Scale**: Handles the project's needs (tracking ~10-20 cities with hourly updates)
- **Learning Focus**: Allows focus on SQL concepts without database administration overhead
- **Development Speed**: Zero configuration required - just start coding

**Note**: If your specific learning goal includes PostgreSQL administration, distributed systems, or advanced database features, you can substitute PostgreSQL. However, SQLite is the recommended choice for this weather dashboard learning project.

## Key Dependencies

**Backend Packages:**
- `express` - Web server framework
- `node-cron` - Task scheduling for hourly weather updates
- `sqlite3` or `better-sqlite3` - SQLite database driver
- `axios` or `node-fetch` - HTTP client for API calls
- `dotenv` - Environment variable management
- `cors` - Enable CORS for frontend-backend communication
- `compression` - Response compression for production
- `helmet` - Security headers
- `jest` - Testing framework
- `supertest` - API endpoint testing
- `nodemon` - Development server with auto-restart

**Optional Production Tools (not required for development):**
- `pm2` - Process manager for production deployment (optional)
- `winston` or `pino` - Logging for production (optional)

**Frontend Libraries:**
- `Chart.js` - Data visualization
- `@testing-library/dom` - For testing vanilla JavaScript DOM manipulation (Option B only)
- `@testing-library/jest-dom` - Additional DOM matchers for Jest (Option B only)

## Security Best Practices

### Environment Variables and Secrets
1. **Create `.env` file immediately** after project initialization
2. **Add to `.gitignore` before any commits**:
   ```gitignore
   # Environment variables
   .env
   .env.local
   .env.*.local
   
   # API keys - extra safety
   *api_key*
   *API_KEY*
   ```
3. **Never hardcode sensitive data** in your code
4. **Use `.env.example`** to show required variables without values:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   PORT=3000
   NODE_ENV=development
   ```
5. **Rotate keys regularly** and especially after any potential exposure
6. **Use different API keys** for development and production (when applicable)

## Deployment Options (Simple, No Docker Required)

### Local Development & Testing
- Run directly with Node.js: `npm start`
- Use `nodemon` for auto-restart during development: `npm run dev`
- No containers or virtualization needed
- SQLite database runs embedded - no separate database server

### Simple Deployment Options (Choose One)
1. **Local Machine Deployment**:
   - Perfect for learning and personal use
   - Run on your computer with `node server.js`
   - Use PM2 for process management: `pm2 start server.js`
   - Access via `localhost:3000`

2. **Free Cloud Deployment** (Recommended for learning):
   - **Render.com**: Free tier with automatic deployments from GitHub
   - **Railway.app**: Simple deployment with GitHub integration
   - **Glitch.com**: Online IDE with instant deployment
   - **Replit**: Code and deploy in browser
   
3. **Traditional VPS** (If you want to learn server management):
   - Deploy to any Linux VPS (DigitalOcean, Linode, etc.)
   - Install Node.js, clone repo, run with PM2
   - No Docker knowledge required

### Deployment Instructions
Create a `deployment.md` file with:
- Step-by-step deployment instructions for chosen platform
- Environment variable configuration for production
- How to set up automatic deploys from GitHub
- Basic monitoring and logging setup

## Running Locally

### Quick Start Guide
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd weather-dashboard

# 2. Install dependencies
npm install
cd backend && npm install
cd ../frontend  # (if separate package.json)

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your OpenWeatherMap API key

# 4. Initialize the database
node backend/src/utils/initDb.js  # Create this script

# 5. Start the application
npm run dev  # Runs with nodemon for auto-restart

# 6. Open browser
# Navigate to http://localhost:3000
```

### Development Scripts
Add these to your **root** `package.json` (single package.json for entire project):
```json
{
  "scripts": {
    "dev": "nodemon backend/src/server.js",
    "start": "node backend/src/server.js",
    "test": "jest --projects backend frontend",
    "test:backend": "jest --projects backend",
    "test:frontend": "jest --projects frontend",
    "test:minimal": "jest tests/*.test.js",
    "test:watch": "jest --watch",
    "init-db": "node backend/src/utils/initDb.js",
    "collect-weather": "node backend/src/utils/manualCollect.js"
  }
}
```
Note: Use a single root package.json that manages both backend and frontend dependencies

## Core Requirements

### 1. Backend API Server [Complexity: Intermediate]
- Use Node.js with Express.js
- Serve frontend static files: `app.use(express.static('frontend'))`
- Implement endpoints to:
  - Add/remove cities to track
  - Fetch current weather for tracked cities
  - Retrieve historical weather data from the database
- Implement scheduled data collection:
  - Use `node-cron` library for scheduling
  - Set up automatic weather data collection every hour for all tracked cities
  - Include a manual trigger endpoint for testing (`POST /api/weather/collect`)
  - Log all scheduled job executions with timestamps
  - Handle failures gracefully and retry failed API calls

### 2. Database [Complexity: Beginner]
- Use SQLite for simplicity and ease of setup
  - No separate database server required
  - Perfect for learning SQL basics and database concepts
  - File-based database that's easy to manage and backup
  - If learning PostgreSQL is a specific goal, you may substitute it, but SQLite is recommended for this project scope
- Schema should include:
  - **Cities table**: id, name, country, latitude, longitude, date_added, last_updated
  - **Weather_records table**: id, city_id, temperature, feels_like, humidity, pressure, wind_speed, weather_condition, timestamp, is_forecast (boolean)
  - **User_preferences table**: for storing dashboard settings
  - **Collection_metadata table**: city_id, first_collection_date, total_records, last_successful_fetch
- Include proper indexes for efficient querying (especially on timestamps and city_id)
- Store both collected data and forecast data with clear distinction
- **Database Access**: Use raw SQL with `better-sqlite3` for learning SQL fundamentals
  - Direct SQL queries help you understand what's happening
  - Example: `db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId)`
  - Only use an ORM (Prisma/Sequelize) if that's a specific learning goal

### 3. Weather API Integration [Complexity: Intermediate]
- **API Setup**:
  - Use OpenWeatherMap free tier API (https://openweathermap.org/api)
  - Sign up for free account at: https://home.openweathermap.org/users/sign_up
  - After registration, get your API key from: https://home.openweathermap.org/api_keys
  - **Free tier limitations**:
    - 60 API calls per minute / 1,000,000 calls per month
    - Current weather data only (no historical data access)
    - 5-day forecast available (3-hour intervals)
    - No bulk downloads or advanced features
  
- **API Key Security** ⚠️ **CRITICAL**:
  - **NEVER commit your API key to GitHub**
  - Store API key in `.env` file: `OPENWEATHER_API_KEY=your_key_here`
  - Add `.env` to `.gitignore` immediately after creating it
  - Create `.env.example` with placeholder: `OPENWEATHER_API_KEY=your_api_key_here`
  - If you accidentally commit an API key:
    1. Immediately revoke it in OpenWeatherMap dashboard
    2. Generate a new key
    3. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
  - Use environment variables in code: `process.env.OPENWEATHER_API_KEY`

- **Implementation Requirements**:
  - **Simple Rate Limiting** (use `express-rate-limit` for beginners):
    ```javascript
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60 // limit to 60 requests per minute
    });
    app.use('/api/weather', limiter);
    ```
  - Cache responses for at least 10 minutes to reduce API calls
  - Handle API errors gracefully (invalid key, rate limit, service down)
  - Log all API calls for debugging and monitoring usage

### 4. Frontend Dashboard [Complexity: Intermediate]
- Single-page application using vanilla JavaScript, HTML5, and CSS3

#### Core Features (Required) [Complexity: Beginner]
- Display current weather cards for each tracked city
- Add/remove cities using a simple text input
- Basic charts showing temperature data as it's collected
- Responsive design for mobile and desktop
- Loading states and error messages

#### Enhanced Features (Optional) [Complexity: Advanced]
- **City Autocomplete** (Choose one approach):
  - Option 1: Use OpenWeatherMap Geocoding API for city search
  - Option 2: Include a JSON file with top 1000 cities
  - Option 3: Simple datalist with predefined major cities
- **Advanced Charts**:
  - Temperature trends with smooth animations
  - Weather condition distribution pie charts
  - Comparative city analysis
- **UI Enhancements**:
  - Dark mode toggle
  - Temperature unit switcher (C/F)
  - Data export to CSV
  - Weather alerts/notifications

#### Data Display Strategy
- Show "Collecting data..." message for new cities
- Display hours/days of data available per city
- Use forecast data (5-day/3-hour) to supplement if needed
- Clearly indicate difference between collected and forecast data

### 5. Data Visualization [Complexity: Intermediate]
- Use Chart.js library for charts
- Implement:
  - **Update Strategy**: Use polling (every 5-10 minutes) or manual refresh button
    - No need for WebSockets since data updates hourly
    - Simple `setInterval()` for auto-refresh: `setInterval(loadCharts, 5 * 60 * 1000)`
    - Include manual refresh button for immediate updates
  - Smooth animations for data transitions
  - Color coding for temperature ranges (cold=blue, warm=orange, hot=red)
  - Weather condition icons
  - Progressive data display as historical data accumulates

### 6. Additional Features

#### Core Features (Required) [Complexity: Beginner]
- Basic error handling for API failures
- Simple data retention (keep last 30 days, delete older)
- Manual data refresh button

#### Optional Enhancements (Stretch Goals) [Complexity: Advanced]
- Export data to CSV (server-side generation)
- Dark mode toggle
- Temperature unit toggle (Celsius/Fahrenheit)
- Basic weather alerts (e.g., notify when temperature drops below freezing)
- Advanced error recovery with retry logic
- Data archival (keep daily averages for 30-90 days before deletion)

### 7. Initial Data & Demo Strategy [Complexity: Intermediate]
Since historical data requires time to collect, implement these strategies for immediate usability.

**Recommended for Beginners**: Start with approach #3 (Progressive Enhancement) combined with #2 (Forecast Integration)

1. **Demo Mode** (for development/presentation):
   - Generate synthetic historical data for past 30 days
   - Clearly mark as "Demo Data" in UI
   - Use realistic temperature patterns based on season/location
   
2. **Forecast Integration**:
   - Use 5-day forecast API (available in free tier)
   - Show forecast as "projected" data in different color/style
   - Combine with collected data as it becomes available
   
3. **Progressive Enhancement**:
   - Hour 1: Show current weather only
   - Day 1: Show hourly progression chart
   - Day 2-6: Show daily averages and trends
   - Day 7+: Full weekly analytics available
   
4. **User Expectations Setting**:
   - Welcome message explaining data collection process
   - "Data Quality" indicator (e.g., "3 days of historical data available")
   - Tooltip explaining why full charts aren't available yet
   - Estimated time until full features available

### 8. Error Handling & Recovery Strategies [Complexity: Intermediate]

#### API Failures
- **OpenWeatherMap Down**: 
  - Cache last successful response for each city (10 minutes)
  - Show cached data with "cached" indicator
  - Retry with exponential backoff (1min, 2min, 4min...)
  - Log failures to database for monitoring

#### Database Failures
- **Connection Lost**:
  - Queue weather data in memory (up to 100 records)
  - Retry connection every 30 seconds
  - Write queued data when connection restored
  - Alert user if queue is full

#### Network Issues
- **User Offline**:
  - Show offline indicator in UI
  - Continue showing cached/local data
  - Queue user actions for when online
  - Auto-sync when connection restored

#### Graceful Degradation
- If charts can't load, show data in tables
- If city search fails, allow manual entry
- If scheduled jobs fail, provide manual trigger
- Always show last known good data with timestamp

### 9. Scheduled Jobs and Background Tasks [Complexity: Advanced]
- **Primary Purpose**: Build historical weather dataset through regular collection
- **Implementation**: Use `node-cron` library for task scheduling

#### Data Retention Policy (Simple Approach)
- **Keep**: Last 30 days of hourly data
- **Delete**: All data older than 30 days
- **Database size**: ~10MB for 10 cities over 30 days
- **Cleanup schedule**: Weekly via cron job

#### Schedule Format 
```javascript
// Cron format: minute hour day month dayOfWeek
// Examples: '0 * * * *' = every hour at minute 0
//          '*/5 * * * *' = every 5 minutes
//          '0 2 * * 0' = Sunday at 2 AM

// Run every hour at minute 0 to build historical data
cron.schedule('0 * * * *', async () => {
  console.log('Building historical dataset - collecting current weather...');
  // Fetch weather for all tracked cities
  // This hourly collection creates the historical data
});

// Weekly cleanup - Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('Running weekly data cleanup...');
  // Simple strategy: Delete data older than 30 days
  // This keeps database size manageable
});
```
- **Required Scheduled Tasks**:
  - **Hourly weather collection** (CRITICAL - this builds your historical data)
    - Fetch current weather for all cities
    - Store with timestamp in weather_records table
    - Update collection_metadata table
    - Handle failures gracefully (don't lose historical continuity)
  - **Weekly data cleanup** (Sunday 2 AM - delete data > 30 days old)
  - **Optional: Daily forecast fetch** (to show future trends)
  
- **Historical Data Building Strategy**:
  - Start collecting immediately when city is added
  - Mark each record with collection timestamp
  - Calculate data availability per city (hours/days collected)
  - Backfill using forecast API if available (mark as forecast vs actual)
  - Never delete recent data (keep at least 30 days)
  
- **Job Management Features**:
  - Ability to start/stop scheduled jobs via API endpoints
  - Job execution history stored in database
  - Error handling with exponential backoff for failed API calls
  - Prevent concurrent execution of the same job
  - Alert mechanism if collection fails for >3 hours (data gap)
  
- **Testing Considerations**:
  - Mock cron jobs in tests using Jest timers
  - Provide manual trigger endpoints for easier testing
  - Test data continuity (no gaps in hourly collection)

## Project Structure

### Minimal Structure (Option A - Recommended for Beginners)
```
weather-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── schedulers/
│   │   └── utils/
│   ├── tests/           # Simple test files
│   │   ├── api.test.js
│   │   └── weather.test.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── database/
│   ├── weather.db
│   └── schema.sql  # Run this directly with sqlite3 to initialize
├── .gitignore
├── progress.md
└── README.md
```

### Comprehensive Structure (Option B - For Testing Practice)
```
weather-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── schedulers/
│   │   │   ├── weatherCollector.js
│   │   │   └── jobManager.js
│   │   └── utils/
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── models/
│   │   └── integration/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── charts.js
│   │   └── api.js
│   ├── tests/
│   │   └── *.test.js
│   └── assets/
├── database/
│   ├── weather.db (SQLite database file)
│   └── schema.sql  # Run this directly: sqlite3 weather.db < schema.sql
├── .gitignore
├── progress.md
├── README.md
└── package.json
```

## Development Constraints
- **Keep it simple - avoid overengineering**
  - Focus on working features over perfect architecture
  - Use straightforward code patterns, avoid unnecessary abstractions
  - Choose minimal testing (Option A) if testing feels overwhelming
  - Add complexity only when you understand why it's needed
- Include error handling and loading states
- Add comments explaining key concepts for learning purposes
- Use environment variables for API keys and sensitive configuration
- SQLite database file should be in the project directory (e.g., `database/weather.db`)
- Focus on local development - no containerization needed
- Implement appropriate level of testing based on your learning goals
- Maintain continuous GitHub synchronization
- Document all progress and decisions

## Version Control Requirements
### GitHub Integration
- Initialize a Git repository at project start
- **CRITICAL: Create `.gitignore` before any commits to prevent API key exposure**
- Create a GitHub repository for the project
- Make thoughtful, manual commits after completing each feature or fix
- **Never use automatic commits** - each commit should be intentional
- Use meaningful commit messages that describe what was changed
- Structure commits logically:
  - One commit per feature or fix
  - Separate commits for tests and implementation
  - Include commit message format: `[type]: description` (e.g., `[feat]: add weather API integration`, `[test]: add unit tests for weather service`, `[security]: add API key to .env`)
- Push changes to GitHub after each development session
- **Security checklist before each push**:
  - Verify `.env` is in `.gitignore`
  - Check no API keys in committed files
  - Review changes for any hardcoded secrets
- Create proper `.gitignore` file:
  ```gitignore
  # Dependencies
  node_modules/
  
  # Environment and secrets
  .env
  .env.*
  !.env.example
  
  # Database
  database/*.db
  !database/schema.sql
  
  # Logs
  *.log
  
  # OS files
  .DS_Store
  Thumbs.db
  ```

## Testing Requirements

### Choose Your Testing Path

#### Option A: Minimal Testing (Recommended for First-Time Learners)
Start here if you're new to testing or want to focus on core functionality first.

**Required Tests (Aim for 40-50% coverage):**
- **Critical Path Tests Only**:
  - Test that API endpoints return correct status codes
  - Test database connection and basic CRUD operations
  - Test weather API integration with mocked responses
  - Test that scheduled jobs execute (basic smoke test)
  - 5-10 total test files maximum

**Simple Testing Structure:**
```
tests/
├── api.test.js         // Test main endpoints
├── database.test.js    // Test DB operations
└── weather.test.js     // Test weather service
```

**Minimal Testing Commands:**
- `npm test` - run all tests
- `npm run test:watch` - run tests in watch mode

#### Option B: Comprehensive Testing (For Testing Practice)
Choose this if learning TDD/testing is a primary goal.

**Full Test Coverage (Target 80%+):**
- All API endpoints with request/response tests
- Database operations with mock data
- Weather API integration with various scenarios
- Frontend function testing
- Error handling and edge cases
- Scheduled job execution and timing

**Complete Testing Structure:**
```
backend/tests/
├── unit/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── utils/
└── integration/
frontend/tests/
└── *.test.js
```

### Testing Guidelines
- **Start with Option A** and upgrade to Option B later if desired
- **Write tests for bugs** - when you fix a bug, add a test
- **Test what matters** - focus on user-facing functionality
- **Don't test libraries** - trust that Chart.js, Express, etc. work
- **Use ChatGPT/Claude** to help write tests if stuck

### Simplified Testing Setup
For Option A (Minimal), you only need:
- `jest` for test runner
- `supertest` for API testing (optional)
- Basic assertions, no complex mocking

For Option B (Comprehensive), add:
- Mock libraries and sophisticated testing patterns
- Coverage reporting tools
- Frontend testing libraries

### API Key Testing Considerations
- **Never use real API keys in tests**
- Mock all external API calls in unit tests
- Use separate test API key for integration tests (if needed)
- Store test API key in `.env.test` (also in `.gitignore`)
- Mock responses should mirror actual API structure:
  ```javascript
  // Example mock response
  const mockWeatherResponse = {
    main: { temp: 20, humidity: 65 },
    weather: [{ main: "Clear", description: "clear sky" }],
    wind: { speed: 5.5 }
  };
  ```

## Documentation Requirements
### Progress Documentation
- Create and maintain a `progress.md` file in the root directory
- Update after each development session
- Include the following sections:

```markdown
# Weather Dashboard Progress

## Project Plan
- [x] Initial setup and GitHub repository
- [x] Database design and setup
- [x] Backend API structure
- [ ] Weather API integration
- [ ] Frontend structure
- [ ] Data visualization implementation
- [ ] Testing implementation
- [ ] Documentation completion

## Daily Progress Log

### 2024-12-03 - Session 1
**Completed:**
- Initialized Git repository and connected to GitHub
- Created project structure with backend/frontend folders
- Set up .gitignore with proper exclusions
- Created initial SQLite database schema

**Challenges:**
- Had to research SQLite date functions for proper timestamp handling
- Solution: Used datetime('now') for automatic timestamps

**Next Steps:**
- Implement Express server with basic routes
- Add OpenWeatherMap API integration

**Code Metrics:**
- Lines of code added: 150
- Test coverage: N/A (no tests yet)
- Number of tests written: 0

**Git Activity:**
- Commits made: 3
  - `initial commit`
  - `[feat]: add project structure`
  - `[feat]: add database schema`
- Branch: main
- Note: These are example commit messages, not predefined hashes

### 2024-12-04 - Session 2
**Completed:**
- Created Express server with error handling
- Added route structure for /api/cities and /api/weather
- Implemented basic rate limiting

(Continue this format for each session...)
```

### README Documentation
The README.md should include:
- Project overview and features
- Prerequisites (Node.js version, npm)
- Installation instructions
- Environment setup (.env configuration)
- How to run locally (`npm install`, `npm start`)
- How to run tests (`npm test`)
- Simple deployment guide (link to deployment.md)
- API documentation for backend endpoints
- Contributing guidelines

## Getting Started Steps
1. Initialize Git repository and connect to GitHub
2. **Create `.gitignore` with `.env` entry BEFORE any other files**
3. Set up the project structure and create initial progress.md
4. **Choose testing approach**: Minimal (beginners) or Comprehensive (testing focus)
5. Sign up for OpenWeatherMap API and securely store key in `.env`
6. Create `.env.example` with placeholder values (commit & push)
7. Initialize SQLite database with tables using schema.sql (commit & push)
8. Create the Express server with basic routes (add tests per chosen approach, commit & push)
9. Implement OpenWeatherMap API integration with security checks (add tests, commit & push)
10. Build the frontend HTML structure (optionally test if using Option B, commit & push)
11. Add Chart.js visualizations (optionally test if using Option B, commit & push)
12. Implement the scheduled data collection (add basic test, commit & push)
13. Add the interactive features (commit & push)
14. Style the application (commit & push)
15. Run test suite - ensure chosen coverage target (40-50% or 80%+)
16. **Security audit**: Verify no secrets in repository history
17. Create deployment documentation and README
18. Deploy to chosen platform (Render, Railway, or local)
19. Test production deployment with real API calls
20. Create final documentation and update progress.md
21. Final commit and push to GitHub

## Instructions for Claude Code
Please build this application step by step, following these guidelines:

1. **Initialize GitHub repository first** - Set up Git and create a remote repository
2. **Choose your testing approach** - Minimal (Option A) or Comprehensive (Option B)
3. **Write tests based on chosen approach** - Can be after implementation for Option A
4. **Commit and push to GitHub after each completed component** - Use meaningful commit messages
5. **Update progress.md after each development session** - Document what was done, challenges faced, and next steps
6. **Explain key decisions** and provide learning notes about important concepts
7. **Start by setting up** the basic project structure, GitHub repo, and database schema

## Workflow for Each Feature

### If Using Minimal Testing (Option A):
1. Plan the feature and update progress.md
2. Implement the feature
3. Write a basic test to verify it works
4. Commit with descriptive message
5. Push to GitHub
6. Update progress.md

### If Using Comprehensive Testing (Option B):
1. Plan the feature and update progress.md
2. Write tests for the feature first (TDD approach)
3. Implement the feature
4. Ensure all tests pass
5. Commit with descriptive message
6. Push to GitHub
7. Update progress.md with completion status and coverage metrics

## Learning Objectives
- Understand RESTful API design
- Practice database design and SQL queries
- Learn asynchronous JavaScript and promises
- **Build and manage time-series data from scratch**
- **Understand the difference between real-time and historical data**
- Implement data visualization with Chart.js
- Handle API rate limiting and caching
- Build a responsive, interactive UI
- Implement scheduled tasks with node-cron
- Understand cron syntax and job scheduling patterns
- Learn to handle background job failures and retries
- **Design systems that improve over time with data collection**
- Master Git workflow and GitHub collaboration
- **Optional: Learn Test-Driven Development (TDD) principles**
- **Write tests at a level appropriate for your experience**
- Deploy a Node.js application to the cloud
- Understand environment configuration for different environments
- Learn basic application monitoring and logging

## Success Criteria

### Functional Requirements (Testable)
- ✅ Can add at least 5 cities and track their weather
- ✅ Weather data collected every hour without gaps (>95% uptime)
- ✅ Historical data visible after 24 hours of operation
- ✅ Charts render within 2 seconds of page load
- ✅ Data persists across application restarts
- ✅ Application handles API downtime gracefully (shows cached data)
- ✅ Manual refresh button works

### Technical Requirements
- ✅ **No API keys in Git history** (verified with `git grep`)
- ✅ Test coverage meets chosen path target (40-50% or 80%+)
- ✅ All endpoints respond within 500ms under normal load
- ✅ Database size stays under 100MB for 10 cities over 30 days
- ✅ Error messages are user-friendly (no stack traces in UI)

### Documentation Requirements
- ✅ README includes clear setup instructions
- ✅ progress.md documents entire development journey
- ✅ Code comments explain complex logic
- ✅ API endpoints documented with examples

### User Experience
- ✅ New users understand data collection model within 30 seconds
- ✅ Interface works on mobile (320px width) and desktop
- ✅ Loading states shown for all async operations
- ✅ Clear indicators for data age and availability

## Common Troubleshooting

### Frequent Issues & Solutions

#### CORS Errors
**Problem**: "Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS"
**Solution**: 
```javascript
// In Express server
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

#### API Key Issues
**Problem**: 401 Unauthorized from OpenWeatherMap
**Solutions**:
- Verify key is correctly copied (no extra spaces)
- Check key is activated (can take 10 minutes)
- Ensure using `process.env.OPENWEATHER_API_KEY` not hardcoded
- Test key at: https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_KEY

#### Database Lock Errors
**Problem**: "SQLITE_BUSY: database is locked"
**Solution**: 
- Use `better-sqlite3` instead of `sqlite3`
- Or implement proper connection pooling
- Ensure you're closing connections after queries

#### Port Already in Use
**Problem**: "Error: listen EADDRINUSE :::3000"
**Solution**:
```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or use different port
PORT=3001 npm start
```

#### Chart.js Not Rendering
**Problem**: Charts appear blank
**Solutions**:
- Check canvas element exists before initializing
- Ensure data format matches Chart.js requirements
- Add explicit width/height to canvas element
- Check browser console for specific errors
