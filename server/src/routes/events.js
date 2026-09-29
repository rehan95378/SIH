const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);

router.get('/', eventController.getEvents);
router.get('/by-formation', eventController.getEventsByFormationAndDepth);
router.get('/:id', eventController.getEventById);
router.post('/', roleMiddleware('ADMIN', 'MANAGER'), eventController.createEvent);
router.put('/:id', roleMiddleware('ADMIN', 'MANAGER'), eventController.updateEvent);
router.delete('/:id', roleMiddleware('ADMIN'), eventController.deleteEvent);

module.exports = router;
