const mongoose = require('mongoose');

const drillingEventSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true },
  eventType: {
    type: String,
    required: true,
    enum: [
      'MUD_LOSS', 'KICK', 'STUCK_PIPE', 'HIGH_TORQUE', 'OVERPRESSURE',
      'FISHING', 'CEMENTING_PROBLEM', 'LOST_CIRCULATION', 'GAS_INFLUX',
      'WASHOUT', 'BIT_BALLING', 'DIFFERENTIAL_STICKING', 'HOLE_STABILITY',
      'NPT', 'FORMATION_DAMAGE', 'TORQUE_SPIKE', 'OTHER'
    ],
  },
  depth: { type: Number, required: true },
  formation: { type: String },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  description: { type: String, required: true },
  cause: { type: String },
  mitigation: { type: String },
  outcome: { type: String },
  nptHours: { type: Number, default: 0 },
  parameters: {
    torque: Number,
    rpm: Number,
    wob: Number,
    rop: Number,
    mudWeight: Number,
    pressure: Number,
  },
  startTime: { type: Date },
  endTime: { type: Date },
  sourceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  sourcePage: { type: Number },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
}, { timestamps: true });

drillingEventSchema.index({ wellId: 1 });
drillingEventSchema.index({ eventType: 1 });
drillingEventSchema.index({ depth: 1 });
drillingEventSchema.index({ formation: 1 });
drillingEventSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('DrillingEvent', drillingEventSchema);
