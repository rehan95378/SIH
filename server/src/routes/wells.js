const express = require('express');
const router = express.Router();
const wellController = require('../controllers/wellController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);

router.get('/', wellController.getWells);
router.get('/:id', wellController.getWellById);
router.get('/:wellId/nearby', wellController.getNearbyWells);
router.get('/:activeWellId/offset-match/:offsetWellId', wellController.getOffsetMatchScore);
router.post('/', roleMiddleware('ADMIN', 'MANAGER'), wellController.createWell);
router.put('/:id', roleMiddleware('ADMIN', 'MANAGER'), wellController.updateWell);
router.delete('/:id', roleMiddleware('ADMIN'), wellController.deleteWell);

module.exports = router;
