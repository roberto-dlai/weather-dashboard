const express = require('express');
const router = express.Router();

// Placeholder routes - will implement in Phase 4
router.get('/current/:cityId', (req, res) => {
  res.json({ message: 'Weather endpoint - coming soon' });
});

router.get('/history/:cityId', (req, res) => {
  res.json({ message: 'History endpoint - coming soon' });
});

router.post('/collect', (req, res) => {
  res.json({ message: 'Manual collection endpoint - coming soon' });
});

module.exports = router;
