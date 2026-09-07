// Records request metadata for later review without blocking the API response.
const { recordAuditEvent } = require('../services/auditService');

const auditLogger = (req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    recordAuditEvent({
      userId: req.user?.id,
      action: `${req.method} ${req.originalUrl}`,
      resourceType: 'http_request',
      metadata: {
        status_code: res.statusCode,
        ip: req.ip
      }
    }).catch((error) => {
      console.error('Audit event could not be stored:', error.message);
    });
  });

  next();
};

module.exports = { auditLogger };
