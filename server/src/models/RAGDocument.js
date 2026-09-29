const mongoose = require('mongoose');

const ragDocumentSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well' },
  wellName: { type: String },
  chunkId: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  pageNumber: { type: Number },
  metadata: {
    formation: String,
    depth: Number,
    depthRange: {
      start: Number,
      end: Number,
    },
    eventType: String,
    reportType: String,
    title: String,
    keywords: [String],
  },
  embeddingId: { type: Number },
  isVerified: { type: Boolean, default: false },
  indexedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ragDocumentSchema.index({ documentId: 1 });
ragDocumentSchema.index({ wellId: 1 });
ragDocumentSchema.index({ isVerified: 1 });

module.exports = mongoose.model('RAGDocument', ragDocumentSchema);
