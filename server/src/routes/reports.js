const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);

router.post('/upload', roleMiddleware('ADMIN'), reportController.upload.single('file'), reportController.uploadReport);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.get('/:id/file', reportController.getReportFile);
router.post('/:id/process', roleMiddleware('ADMIN'), reportController.processReport);
router.post('/:id/approve-item', roleMiddleware('ADMIN'), reportController.approveExtractedItem);
router.post('/:id/reject-item', roleMiddleware('ADMIN'), reportController.rejectExtractedItem);

module.exports = router;
