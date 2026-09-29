const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userRole: { type: String },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'REGISTER',
      'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'ROLE_CHANGED', 'PASSWORD_RESET',
      'WELL_CREATED', 'WELL_UPDATED', 'WELL_DELETED',
      'REPORT_UPLOADED', 'REPORT_PROCESSED', 'REPORT_APPROVED', 'REPORT_REJECTED',
      'AI_EXTRACTION_GENERATED', 'DATA_EDITED', 'DATA_APPROVED', 'DATA_REJECTED',
      'KNOWLEDGE_INDEXED', 'RISK_ACKNOWLEDGED', 'EVENT_CREATED', 'EVENT_UPDATED',
      'ALERT_CREATED', 'ALERT_ACKNOWLEDGED', 'SYSTEM_HEALTH_CHECK', 'OTHER'
    ],
  },
  entityType: { type: String },
  entityId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
