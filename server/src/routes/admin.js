const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware, roleMiddleware('ADMIN'));

router.get('/data-quality', analyticsController.getDataQuality);
router.get('/system-health', analyticsController.getSystemHealth);
router.get('/audit-logs', analyticsController.getAuditLogs);

module.exports = router;
