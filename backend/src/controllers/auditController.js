// Audit controller returns action history for investigation review.
const { asyncHandler } = require('../utils/asyncHandler');
const { getAuditRecords } = require('../services/auditService');

const getAuditLog = asyncHandler(async (req, res) => {
  const logs = await getAuditRecords({
    userId: req.query.user_id,
    limit: req.query.limit,
    offset: req.query.offset
  });

  return res.json({ logs });
});

module.exports = { getAuditLog };
