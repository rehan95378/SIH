// Routes for audit history and visible actions.
const express = require('express');
const { getAuditLog } = require('../controllers/auditController');
const { requireRole } = require('../middleware/role');
const router = express.Router();

router.get('/audit', requireRole('admin', 'investigator'), getAuditLog);

module.exports = router;
