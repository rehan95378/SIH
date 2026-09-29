const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');
const Well = require('../models/Well');
const DrillingEvent = require('../models/DrillingEvent');
const Report = require('../models/Report');
const RiskAlert = require('../models/RiskAlert');
const DrillingReading = require('../models/DrillingReading');
const AuditLog = require('../models/AuditLog');

async function initMockDb() {
  console.log('⚡ Initializing Bulletproof In-Memory Mock Store...');

  const hashedPass = await bcrypt.hash('Demo@2024', 10);
  const adminId = new mongoose.Types.ObjectId('6571a0000000000000000001');
  const engId = new mongoose.Types.ObjectId('6571a0000000000000000002');
  const mgrId = new mongoose.Types.ObjectId('6571a0000000000000000003');

  const users = [
    {
      _id: adminId, name: 'Admin Kumar', email: 'admin@ertmac.demo', password: hashedPass,
      role: 'ADMIN', department: 'IT & Digital', status: 'ACTIVE',
      comparePassword: async function(p) { return bcrypt.compare(p, this.password); },
      toJSON: function() { return { _id: this._id, name: this.name, email: this.email, role: this.role, department: this.department, status: this.status }; },
      toObject: function() { return { _id: this._id, name: this.name, email: this.email, role: this.role, department: this.department, status: this.status }; },
      save: async function() { return this; }
    },
    {
      _id: engId, name: 'Rajesh Engineer', email: 'engineer@ertmac.demo', password: hashedPass,
      role: 'ENGINEER', department: 'Drilling Engineering', status: 'ACTIVE',
      comparePassword: async function(p) { return bcrypt.compare(p, this.password); },
      toJSON: function() { return { _id: this._id, name: this.name, email: this.email, role: this.role, department: this.department, status: this.status }; },
      toObject: function() { return { _id: this._id, name: this.name, email: this.email, role: this.role, department: this.department, status: this.status }; },
      save: async function() { return this; }
    },
    {
      _id: mgrId, name: 'Manager Singh', email: 'manager@ertmac.demo', password: hashedPass,
      role: 'MANAGER', department: 'Drilling Operations', status: 'ACTIVE',
      comparePassword: async function(p) { return bcrypt.compare(p, this.password); },
      toJSON: function() { return { _id: this._id, name: this.name, email: this.email, role: this.role, department: this.department, status: this.status }; },
      toObject: function() { return { _id: this._id, name: this.name, email: this.email, role: this.role, department: this.department, status: this.status }; },
      save: async function() { return this; }
    },
  ];

  const w101Id = new mongoose.Types.ObjectId('6571b0000000000000000101');
  const w102Id = new mongoose.Types.ObjectId('6571b0000000000000000102');
  const w103Id = new mongoose.Types.ObjectId('6571b0000000000000000103');

  const wells = [
    {
      _id: w101Id, wellName: 'WELL-101', field: 'Deohal Field', operator: 'Oil India Limited',
      latitude: 27.3850, longitude: 95.3200, status: 'DRILLING',
      currentDepth: 2820, targetDepth: 3500, currentFormation: 'Formation-X',
      riskLevel: 'HIGH', spudDate: new Date('2024-08-01'), isActive: true,
      formations: [
        { name: 'Alluvium', topDepth: 0, bottomDepth: 250, lithology: 'Sand & Clay' },
        { name: 'Tipam Formation', topDepth: 250, bottomDepth: 900, lithology: 'Sandstone' },
        { name: 'Barail Formation', topDepth: 900, bottomDepth: 1800, lithology: 'Sandstone/Shale' },
        { name: 'Kopili Formation', topDepth: 1800, bottomDepth: 2500, lithology: 'Shale' },
        { name: 'Formation-X', topDepth: 2500, bottomDepth: 3000, lithology: 'Limestone/Dolomite', description: 'Target carbonate reservoir' },
        { name: 'Formation-Y', topDepth: 3000, bottomDepth: 3500, lithology: 'Limestone' },
      ],
      trajectory: { type: 'DIRECTIONAL', inclination: 12.5, azimuth: 245, kickoffPoint: 1200 },
      description: 'Active directional well targeting Formation-X carbonate reservoir.',
      createdBy: adminId,
      toObject: function() { return { ...this }; },
    },
    {
      _id: w102Id, wellName: 'WELL-102', field: 'Deohal Field', operator: 'Oil India Limited',
      latitude: 27.3760, longitude: 95.3310, status: 'COMPLETED',
      currentDepth: 3420, targetDepth: 3420, currentFormation: 'Formation-Y',
      riskLevel: 'LOW', spudDate: new Date('2023-03-15'), completionDate: new Date('2023-11-20'), isActive: true,
      formations: [], description: 'Completed well.', createdBy: adminId,
      toObject: function() { return { ...this }; },
    },
    {
      _id: w103Id, wellName: 'WELL-103', field: 'Deohal Field', operator: 'Oil India Limited',
      latitude: 27.3660, longitude: 95.3380, status: 'COMPLETED',
      currentDepth: 3300, targetDepth: 3300, currentFormation: 'Formation-Y',
      riskLevel: 'MEDIUM', spudDate: new Date('2022-06-10'), completionDate: new Date('2023-01-15'), isActive: true,
      formations: [], description: 'Key offset well.', createdBy: adminId,
      toObject: function() { return { ...this }; },
    },
  ];

  const reportId = new mongoose.Types.ObjectId('6571c0000000000000000001');
  const reports = [
    {
      _id: reportId, title: 'WELL-103 Daily Drilling Report — Formation-X Interval',
      fileName: 'well103-ddr-demo.pdf', filePath: 'uploads/reports/well103-ddr-demo.pdf',
      fileSize: 245000, mimeType: 'application/pdf',
      wellId: w103Id, wellName: 'WELL-103', reportType: 'DAILY_DRILLING_REPORT',
      uploadedBy: adminId, extractionStatus: 'COMPLETED', verificationStatus: 'PARTIALLY_APPROVED',
      rawText: 'DAILY DRILLING REPORT — WELL-103\nMUD LOSS INCIDENT at 2850m in Formation-X.',
      pageCount: 14, version: 1, isDemo: true, indexedInRAG: false,
      extractedData: [
        { eventType: 'MUD_LOSS', depth: 2850, formation: 'Formation-X', severity: 'HIGH', description: 'Partial mud loss at 2850m in Formation-X carbonate.', verificationStatus: 'APPROVED' },
      ],
      toObject: function() { return { ...this }; },
    },
  ];

  const events = [
    {
      _id: new mongoose.Types.ObjectId('6571d0000000000000000001'),
      wellId: w103Id, eventType: 'MUD_LOSS', depth: 2850, formation: 'Formation-X', severity: 'HIGH',
      description: 'Partial mud loss detected while drilling through Formation-X carbonate zone at 2850m. Loss rate: 25-30 bbl/hr.',
      cause: 'Natural fracture system in Formation-X carbonate zone.',
      mitigation: 'Drilling stopped. LCM pill (50 bbl mix) spotted.',
      outcome: 'Resumed after 6.5 hours NPT.', nptHours: 6.5,
      parameters: { torque: 18.5, rpm: 45, wob: 180, rop: 2.8, mudWeight: 1.32, pressure: 185 },
      sourceDocumentId: reportId, verificationStatus: 'APPROVED', createdBy: adminId, verifiedBy: adminId, verifiedAt: new Date(),
      toObject: function() { return { ...this }; },
    },
  ];

  const riskAlerts = [
    {
      _id: new mongoose.Types.ObjectId('6571e0000000000000000001'),
      activeWellId: w101Id, offsetWellId: w103Id, eventId: events[0]._id,
      activeWellName: 'WELL-101', offsetWellName: 'WELL-103',
      currentDepth: 2820, historicalDepth: 2850, depthDifference: 30,
      distance: 2.1, formationSimilarity: 'EXACT_MATCH',
      riskLevel: 'HIGH', riskScore: 88, eventType: 'MUD_LOSS',
      reason: 'Active well WELL-101 is at 2820m depth in Formation-X, only 30m away from historical MUD_LOSS incident at 2850m in offset well WELL-103 (2.1km away). High risk of severe mud loss.',
      evidence: [
        { label: 'Offset Well', value: 'WELL-103 (2.1 km distance)' },
        { label: 'Historical Event', value: 'MUD_LOSS at 2850m (NPT: 6.5 hrs)' },
      ],
      status: 'OPEN', isActive: true,
      toObject: function() { return { ...this }; },
    },
  ];

  const readings = [
    { _id: new mongoose.Types.ObjectId(), wellId: w101Id, timestamp: new Date(), depth: 2820, torque: 18.2, rpm: 50, wob: 175, rop: 3.2, mudWeight: 1.32, mudFlow: 1200, pressure: 185, temperature: 78, hookLoad: 120, isDemo: true },
  ];

  // Helper function to build chainable Mongoose query object
  const makeQuery = (result) => {
    const q = Promise.resolve(result);
    q.select = () => q;
    q.sort = () => q;
    q.skip = () => q;
    q.limit = () => q;
    q.populate = () => q;
    q.exec = () => q;
    q.lean = () => Promise.resolve(result);
    return q;
  };

  // Override User
  User.findOne = (filter) => {
    const email = filter?.email;
    const id = filter?._id;
    let found = users.find(u => (!email || u.email === email) && (!id || String(u._id) === String(id)));
    if (!found && email) found = users[0];
    return makeQuery(found);
  };
  User.findById = (id) => makeQuery(users.find(u => String(u._id) === String(id)) || users[0]);
  User.find = (filter) => makeQuery(users);

  // Override Well
  Well.find = (filter) => makeQuery(wells);
  Well.findById = (id) => makeQuery(wells.find(w => String(w._id) === String(id)) || wells[0]);
  Well.findOne = (filter) => makeQuery(wells.find(w => String(w._id) === String(filter?._id)) || wells[0]);
  Well.countDocuments = (filter) => Promise.resolve(wells.length);

  // Override DrillingEvent
  DrillingEvent.find = (filter) => {
    let res = events;
    if (filter?.wellId) res = events.filter(e => String(e.wellId) === String(filter.wellId));
    return makeQuery(res);
  };
  DrillingEvent.findById = (id) => makeQuery(events.find(e => String(e._id) === String(id)) || events[0]);
  DrillingEvent.findOne = (filter) => makeQuery(events[0]);
  DrillingEvent.countDocuments = (filter) => Promise.resolve(events.length);

  // Override Report
  Report.find = (filter) => makeQuery(reports);
  Report.findById = (id) => makeQuery(reports[0]);
  Report.findOne = (filter) => makeQuery(reports[0]);
  Report.countDocuments = (filter) => Promise.resolve(reports.length);

  // Override RiskAlert
  RiskAlert.find = (filter) => makeQuery(riskAlerts);
  RiskAlert.findById = (id) => makeQuery(riskAlerts[0]);
  RiskAlert.findOne = (filter) => makeQuery(riskAlerts[0]);
  RiskAlert.countDocuments = (filter) => Promise.resolve(riskAlerts.length);

  // Override DrillingReading
  DrillingReading.find = (filter) => makeQuery(readings);

  // Override AuditLog
  AuditLog.find = (filter) => makeQuery([]);
  AuditLog.create = async (doc) => Promise.resolve({ _id: new mongoose.Types.ObjectId(), ...doc });

  console.log('✅ Bulletproof In-Memory Store initialized!');
}

module.exports = initMockDb;
