// Admin controller handles privileged operations.
const { asyncHandler } = require('../utils/asyncHandler');
const { getOverview } = require('../services/adminService');

const getAdminOverview = asyncHandler(async (req, res) => {
  const overview = await getOverview();
  return res.json({ overview });
});

module.exports = { getAdminOverview };
