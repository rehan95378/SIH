const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);

router.get('/', riskController.getRisks);
router.get('/active/:wellId', riskController.getRisksByWell);
router.post('/calculate', roleMiddleware('ENGINEER', 'MANAGER', 'ADMIN'), riskController.calculateRisk);
router.post('/:id/acknowledge', roleMiddleware('ENGINEER', 'MANAGER', 'ADMIN'), riskController.acknowledgeRisk);

module.exports = router;
