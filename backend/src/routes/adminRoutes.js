// Routes for privileged admin actions.
const express = require('express');
const {
  getAdminOverview,
  listAdminUsers,
  updateAdminUserRole
} = require('../controllers/adminController');
const { requireRole } = require('../middleware/role');
const router = express.Router();

router.get('/admin/overview', requireRole('admin'), getAdminOverview);
router.get('/admin/users', requireRole('admin'), listAdminUsers);
router.patch('/admin/users/:id/role', requireRole('admin'), updateAdminUserRole);

module.exports = router;
