const mongoose = require('mongoose');

const drillingReadingSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  depth: { type: Number, required: true },
  torque: { type: Number },
  rpm: { type: Number },
  wob: { type: Number },
  rop: { type: Number },
  mudWeight: { type: Number },
  mudFlow: { type: Number },
  pressure: { type: Number },
  temperature: { type: Number },
  hookLoad: { type: Number },
  bitSize: { type: Number },
  casingSize: { type: Number },
  pumpPressure: { type: Number },
  ecd: { type: Number },
  isDemo: { type: Boolean, default: true },
}, { timestamps: false });

drillingReadingSchema.index({ wellId: 1, timestamp: -1 });
drillingReadingSchema.index({ wellId: 1, depth: 1 });

module.exports = mongoose.model('DrillingReading', drillingReadingSchema);
