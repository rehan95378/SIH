// Routes for privileged admin actions.
const express = require('express');
const { getAdminOverview } = require('../controllers/adminController');
const { requireRole } = require('../middleware/role');
const router = express.Router();

router.get('/admin/overview', requireRole('admin'), getAdminOverview);

module.exports = router;
