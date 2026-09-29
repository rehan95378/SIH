const mongoose = require('mongoose');

const riskAlertSchema = new mongoose.Schema({
  activeWellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true },
  offsetWellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrillingEvent' },
  activeWellName: { type: String },
  offsetWellName: { type: String },
  currentDepth: { type: Number, required: true },
  historicalDepth: { type: Number, required: true },
  depthDifference: { type: Number, required: true },
  distance: { type: Number, required: true },
  formationSimilarity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', 'NONE'], default: 'MEDIUM' },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  riskScore: { type: Number, min: 0, max: 100 },
  eventType: { type: String },
  reason: { type: String, required: true },
  evidence: [{ 
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    documentTitle: String,
    page: Number,
    text: String,
  }],
  riskFactors: [{
    factor: String,
    value: String,
    weight: Number,
    contribution: Number,
  }],
  status: {
    type: String,
    enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'],
    default: 'OPEN',
  },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },
  acknowledgedNote: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

riskAlertSchema.index({ activeWellId: 1 });
riskAlertSchema.index({ riskLevel: 1 });
riskAlertSchema.index({ status: 1 });

module.exports = mongoose.model('RiskAlert', riskAlertSchema);
