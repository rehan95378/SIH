const AuditLog = require('../models/AuditLog');

const auditLog = async (userId, action, entityType, entityId, details, req) => {
  try {
    await AuditLog.create({
      userId,
      userName: req?.user?.name,
      userRole: req?.user?.role,
      action,
      entityType,
      entityId: entityId ? entityId.toString() : null,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = auditLog;
