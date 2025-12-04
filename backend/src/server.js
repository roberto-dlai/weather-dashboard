const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const { getDb } = require('./utils/db');
const citiesRouter = require('./routes/cities');
const weatherRouter = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,  // Disable for Chart.js CDN
}));

// CORS - allow frontend to access API
app.use(cors());

// Compression for responses
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (simple version)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/cities', citiesRouter);
app.use('/api/weather', weatherRouter);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM cities').get();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cities: result.count
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: { message: 'API endpoint not found', status: 404 } });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Weather Dashboard server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
  });
}

module.exports = app;  // Export for testing
