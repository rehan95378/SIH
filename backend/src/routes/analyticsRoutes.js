// Routes for network scores and suspicious-pattern results.
const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const router = express.Router();

router.get('/analytics', getAnalytics);

module.exports = router;
