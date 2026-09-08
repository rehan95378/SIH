// Admin controller handles privileged operations.
const { asyncHandler } = require('../utils/asyncHandler');
const { getOverview, getUsers, changeUserRole } = require('../services/adminService');

const getAdminOverview = asyncHandler(async (req, res) => {
  const overview = await getOverview();
  return res.json({ overview });
});

const listAdminUsers = asyncHandler(async (req, res) => {
  const users = await getUsers();
  return res.json({ users });
});

const updateAdminUserRole = asyncHandler(async (req, res) => {
  const user = await changeUserRole(req.params.id, req.body.role);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  return res.json({ user });
});

module.exports = { getAdminOverview, listAdminUsers, updateAdminUserRole };
