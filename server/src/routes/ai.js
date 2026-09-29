const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/chat', aiController.chat);
router.post('/search', aiController.search);
router.post('/analyze-report', aiController.analyzeReport);
router.post('/compare-wells', aiController.compareWells);
router.post('/operations-summary', aiController.operationsSummary);

module.exports = router;
