const mongoose = require('mongoose');

const extractedDataSchema = new mongoose.Schema({
  eventType: String,
  depth: Number,
  formation: String,
  severity: String,
  description: String,
  mitigation: String,
  sourcePage: Number,
  confidence: Number,
  verificationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  adminNotes: String,
}, { _id: true });

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well' },
  wellName: { type: String },
  reportType: {
    type: String,
    enum: ['DAILY_DRILLING_REPORT', 'WELL_COMPLETION_REPORT', 'MUD_LOG', 'GEOLOGICAL_REPORT', 'INCIDENT_REPORT', 'OTHER'],
    default: 'OTHER',
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  extractionStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING_REVIEW', 'PARTIALLY_APPROVED', 'FULLY_APPROVED', 'REJECTED'],
    default: 'PENDING_REVIEW',
  },
  extractedData: [extractedDataSchema],
  rawText: { type: String },
  pageCount: { type: Number },
  version: { type: Number, default: 1 },
  previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  sourceMetadata: {
    originalName: String,
    uploadIp: String,
    processingTime: Number,
  },
  isDemo: { type: Boolean, default: false },
  indexedInRAG: { type: Boolean, default: false },
  indexedAt: { type: Date },
}, { timestamps: true });

reportSchema.index({ wellId: 1 });
reportSchema.index({ uploadedBy: 1 });
reportSchema.index({ verificationStatus: 1 });
reportSchema.index({ extractionStatus: 1 });

module.exports = mongoose.model('Report', reportSchema);
