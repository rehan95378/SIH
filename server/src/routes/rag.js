const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);

router.post('/index', roleMiddleware('ADMIN'), ragController.indexDocument);
router.post('/search', ragController.ragSearch);
router.get('/status', ragController.getRAGStatus);

module.exports = router;
