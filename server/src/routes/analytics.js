const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);

router.get('/overview', analyticsController.getOverview);
router.get('/wells', analyticsController.getWellAnalytics);
router.get('/events', analyticsController.getEventAnalytics);
router.get('/risks', analyticsController.getRiskAnalytics);
router.get('/formations', analyticsController.getFormationAnalytics);
router.get('/npt', analyticsController.getNPTAnalytics);

module.exports = router;
