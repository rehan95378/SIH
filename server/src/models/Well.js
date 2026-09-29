const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topDepth: { type: Number, required: true },
  bottomDepth: { type: Number, required: true },
  lithology: { type: String },
  description: { type: String },
  porosity: { type: Number },
  permeability: { type: Number },
  fluidType: { type: String, enum: ['OIL', 'GAS', 'WATER', 'DRY', 'UNKNOWN'], default: 'UNKNOWN' },
});

const drillingParameterSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  depth: { type: Number },
  torque: { type: Number },
  rpm: { type: Number },
  wob: { type: Number },
  rop: { type: Number },
  mudWeight: { type: Number },
  mudFlow: { type: Number },
  pressure: { type: Number },
  temperature: { type: Number },
  hookLoad: { type: Number },
});

const wellSchema = new mongoose.Schema({
  wellName: { type: String, required: true, unique: true, trim: true },
  field: { type: String, required: true, trim: true },
  operator: { type: String, default: 'Oil India Limited' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: {
    type: String,
    enum: ['DRILLING', 'COMPLETED', 'SUSPENDED', 'ABANDONED', 'PRODUCING', 'TESTING'],
    default: 'DRILLING',
  },
  currentDepth: { type: Number, default: 0 },
  targetDepth: { type: Number, required: true },
  currentFormation: { type: String },
  formations: [formationSchema],
  trajectory: {
    type: { type: String, enum: ['VERTICAL', 'DIRECTIONAL', 'HORIZONTAL'], default: 'VERTICAL' },
    inclination: { type: Number, default: 0 },
    azimuth: { type: Number, default: 0 },
    kickoffPoint: { type: Number },
  },
  drillingParameters: [drillingParameterSchema],
  spudDate: { type: Date },
  completionDate: { type: Date },
  description: { type: String },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

wellSchema.index({ latitude: 1, longitude: 1 });
wellSchema.index({ field: 1 });
wellSchema.index({ status: 1 });

module.exports = mongoose.model('Well', wellSchema);
