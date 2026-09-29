/**
 * eRTMAC-NWIS Seed Script
 * IMPORTANT: All data is REPRESENTATIVE DEMONSTRATION DATA — NOT real Oil India data.
 */
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ertmac_nwis';

/* ─── Inline Schema Definitions (avoid import path issues) ─────────────── */
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, enum: ['ENGINEER', 'MANAGER', 'ADMIN'], default: 'ENGINEER' },
  department: String, status: { type: String, default: 'ACTIVE' }, lastLogin: Date,
}, { timestamps: true });

const formationSchema = new mongoose.Schema({
  name: String, topDepth: Number, bottomDepth: Number,
  lithology: String, description: String,
});

const wellSchema = new mongoose.Schema({
  wellName: { type: String, unique: true }, field: String,
  operator: { type: String, default: 'Oil India Limited' },
  latitude: Number, longitude: Number,
  status: { type: String, default: 'DRILLING' },
  currentDepth: Number, targetDepth: Number, currentFormation: String,
  formations: [formationSchema],
  trajectory: { type: Object, default: {} },
  spudDate: Date, completionDate: Date, description: String,
  riskLevel: { type: String, default: 'LOW' },
  isActive: { type: Boolean, default: true },
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const drillingEventSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well2' },
  eventType: String, depth: Number, formation: String,
  severity: String, description: String, cause: String,
  mitigation: String, outcome: String, nptHours: Number,
  parameters: Object, startTime: Date, endTime: Date,
  sourceDocumentId: mongoose.Schema.Types.ObjectId, sourcePage: Number,
  verificationStatus: { type: String, default: 'PENDING' },
  createdBy: mongoose.Schema.Types.ObjectId,
  verifiedBy: mongoose.Schema.Types.ObjectId, verifiedAt: Date,
}, { timestamps: true });

const extractedDataSchema = new mongoose.Schema({
  eventType: String, depth: Number, formation: String, severity: String,
  description: String, mitigation: String, sourcePage: Number,
  confidence: Number,
  verificationStatus: { type: String, default: 'PENDING' },
  verifiedBy: mongoose.Schema.Types.ObjectId, verifiedAt: Date, adminNotes: String,
});

const reportSchema = new mongoose.Schema({
  title: String, fileName: String, filePath: String,
  fileSize: Number, mimeType: String,
  wellId: mongoose.Schema.Types.ObjectId, wellName: String,
  reportType: String, uploadedBy: mongoose.Schema.Types.ObjectId,
  extractionStatus: { type: String, default: 'PENDING' },
  verificationStatus: { type: String, default: 'PENDING_REVIEW' },
  extractedData: [extractedDataSchema],
  rawText: String, pageCount: Number, version: { type: Number, default: 1 },
  isDemo: { type: Boolean, default: false },
  indexedInRAG: { type: Boolean, default: false },
  sourceMetadata: Object,
}, { timestamps: true });

const riskAlertSchema = new mongoose.Schema({
  activeWellId: mongoose.Schema.Types.ObjectId, offsetWellId: mongoose.Schema.Types.ObjectId,
  eventId: mongoose.Schema.Types.ObjectId,
  activeWellName: String, offsetWellName: String,
  currentDepth: Number, historicalDepth: Number, depthDifference: Number,
  distance: Number, formationSimilarity: String,
  riskLevel: String, riskScore: Number, eventType: String,
  reason: String, evidence: [Object], riskFactors: [Object],
  status: { type: String, default: 'OPEN' },
  acknowledgedBy: mongoose.Schema.Types.ObjectId, acknowledgedAt: Date, acknowledgedNote: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const drillingReadingSchema = new mongoose.Schema({
  wellId: mongoose.Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now },
  depth: Number, torque: Number, rpm: Number, wob: Number,
  rop: Number, mudWeight: Number, mudFlow: Number,
  pressure: Number, temperature: Number, hookLoad: Number,
  isDemo: { type: Boolean, default: true },
});

const auditLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, userName: String, userRole: String,
  action: String, entityType: String, entityId: String,
  details: mongoose.Schema.Types.Mixed, ipAddress: String,
  timestamp: { type: Date, default: Date.now },
});

// Register models with unique names to avoid conflicts
const User = mongoose.model('User', userSchema);
const Well = mongoose.model('Well', wellSchema);
const DrillingEvent = mongoose.model('DrillingEvent', drillingEventSchema);
const Report = mongoose.model('Report', reportSchema);
const RiskAlert = mongoose.model('RiskAlert', riskAlertSchema);
const DrillingReading = mongoose.model('DrillingReading', drillingReadingSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function seed(shouldDisconnect = false) {
  console.log('🚀 eRTMAC-NWIS Seed Script');

  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to:', MONGODB_URI.substring(0, 50) + '...');
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 60000,
      });
      console.log('✅ MongoDB connected:', mongoose.connection.host);
    }

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Well.deleteMany({});
    await DrillingEvent.deleteMany({});
    await DrillingReading.deleteMany({});
    await RiskAlert.deleteMany({});
    await Report.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('✅ Cleared');

    // ── USERS ────────────────────────────────────────────────────────────────
    const hashedPass = await bcrypt.hash('Demo@2024', 12);
    const users = await User.insertMany([
      { name: 'Admin Kumar',     email: 'admin@ertmac.demo',      password: hashedPass, role: 'ADMIN',    department: 'IT & Digital' },
      { name: 'Admin Sharma',    email: 'admin2@ertmac.demo',     password: hashedPass, role: 'ADMIN',    department: 'Data Management' },
      { name: 'Admin Patel',     email: 'admin3@ertmac.demo',     password: hashedPass, role: 'ADMIN',    department: 'Knowledge Management' },
      { name: 'Rajesh Engineer', email: 'engineer@ertmac.demo',   password: hashedPass, role: 'ENGINEER', department: 'Drilling Engineering' },
      { name: 'Priya Sinha',     email: 'engineer2@ertmac.demo',  password: hashedPass, role: 'ENGINEER', department: 'Drilling Engineering' },
      { name: 'Amit Verma',      email: 'engineer3@ertmac.demo',  password: hashedPass, role: 'ENGINEER', department: 'Mud Engineering' },
      { name: 'Suresh Nair',     email: 'engineer4@ertmac.demo',  password: hashedPass, role: 'ENGINEER', department: 'Well Engineering' },
      { name: 'Kavita Das',      email: 'engineer5@ertmac.demo',  password: hashedPass, role: 'ENGINEER', department: 'Drilling Engineering' },
      { name: 'Manager Singh',   email: 'manager@ertmac.demo',    password: hashedPass, role: 'MANAGER',  department: 'Drilling Operations' },
      { name: 'Manager Gupta',   email: 'manager2@ertmac.demo',   password: hashedPass, role: 'MANAGER',  department: 'Field Operations' },
    ]);
    const adminUser = users[0];
    const engineerUser = users[3];
    console.log(`✅ Created ${users.length} users`);

    // ── WELLS ─────────────────────────────────────────────────────────────────
    const wells = await Well.insertMany([
      {
        wellName: 'WELL-101', field: 'Deohal Field', operator: 'Oil India Limited',
        latitude: 27.3850, longitude: 95.3200, status: 'DRILLING',
        currentDepth: 2820, targetDepth: 3500, currentFormation: 'Formation-X',
        riskLevel: 'HIGH', spudDate: new Date('2024-08-01'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 250,  lithology: 'Sand & Clay' },
          { name: 'Tipam Formation',  topDepth: 250,  bottomDepth: 900,  lithology: 'Sandstone' },
          { name: 'Barail Formation', topDepth: 900,  bottomDepth: 1800, lithology: 'Sandstone/Shale' },
          { name: 'Kopili Formation', topDepth: 1800, bottomDepth: 2500, lithology: 'Shale' },
          { name: 'Formation-X',      topDepth: 2500, bottomDepth: 3000, lithology: 'Limestone/Dolomite', description: 'Target carbonate reservoir' },
          { name: 'Formation-Y',      topDepth: 3000, bottomDepth: 3500, lithology: 'Limestone' },
        ],
        trajectory: { type: 'DIRECTIONAL', inclination: 12.5, azimuth: 245, kickoffPoint: 1200 },
        description: 'Active directional well targeting Formation-X carbonate reservoir.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-102', field: 'Deohal Field',
        latitude: 27.3760, longitude: 95.3310, status: 'COMPLETED',
        currentDepth: 3420, targetDepth: 3420, currentFormation: 'Formation-Y',
        riskLevel: 'LOW', spudDate: new Date('2023-03-15'), completionDate: new Date('2023-11-20'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 240  },
          { name: 'Tipam Formation',  topDepth: 240,  bottomDepth: 890  },
          { name: 'Barail Formation', topDepth: 890,  bottomDepth: 1780 },
          { name: 'Kopili Formation', topDepth: 1780, bottomDepth: 2480 },
          { name: 'Formation-X',      topDepth: 2480, bottomDepth: 3000 },
          { name: 'Formation-Y',      topDepth: 3000, bottomDepth: 3420 },
        ],
        description: 'Completed well, producing from Formation-Y.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-103', field: 'Deohal Field',
        latitude: 27.3660, longitude: 95.3380, status: 'COMPLETED',
        currentDepth: 3300, targetDepth: 3300, currentFormation: 'Formation-Y',
        riskLevel: 'MEDIUM', spudDate: new Date('2022-06-10'), completionDate: new Date('2023-01-15'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 260  },
          { name: 'Tipam Formation',  topDepth: 260,  bottomDepth: 910  },
          { name: 'Barail Formation', topDepth: 910,  bottomDepth: 1820 },
          { name: 'Kopili Formation', topDepth: 1820, bottomDepth: 2510 },
          { name: 'Formation-X',      topDepth: 2510, bottomDepth: 3020, lithology: 'Limestone/Dolomite', description: 'Highly fractured carbonate — known mud loss zone' },
          { name: 'Formation-Y',      topDepth: 3020, bottomDepth: 3300 },
        ],
        description: 'Key offset well. Formation-X zone highly fractured with confirmed mud loss history.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-104', field: 'Deohal Field',
        latitude: 27.3520, longitude: 95.3080, status: 'SUSPENDED',
        currentDepth: 2950, targetDepth: 3500, currentFormation: 'Formation-X',
        riskLevel: 'HIGH', spudDate: new Date('2023-09-01'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 255  },
          { name: 'Tipam Formation',  topDepth: 255,  bottomDepth: 905  },
          { name: 'Barail Formation', topDepth: 905,  bottomDepth: 1790 },
          { name: 'Kopili Formation', topDepth: 1790, bottomDepth: 2490 },
          { name: 'Formation-X',      topDepth: 2490, bottomDepth: 3500 },
        ],
        description: 'Suspended due to high-pressure kick at 2900m in Formation-X.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-105', field: 'Nagapathar Field',
        latitude: 27.4120, longitude: 95.3650, status: 'PRODUCING',
        currentDepth: 3150, targetDepth: 3150, currentFormation: 'Formation-Z',
        riskLevel: 'LOW', spudDate: new Date('2021-04-20'), completionDate: new Date('2022-02-28'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 270  },
          { name: 'Tipam Formation',  topDepth: 270,  bottomDepth: 920  },
          { name: 'Barail Formation', topDepth: 920,  bottomDepth: 1850 },
          { name: 'Kopili Formation', topDepth: 1850, bottomDepth: 2550 },
          { name: 'Formation-Z',      topDepth: 2550, bottomDepth: 3150 },
        ],
        description: 'Producing well from Formation-Z.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-106', field: 'Nagapathar Field',
        latitude: 27.4280, longitude: 95.2980, status: 'PRODUCING',
        currentDepth: 2980, targetDepth: 2980, currentFormation: 'Formation-X',
        riskLevel: 'LOW', spudDate: new Date('2020-07-15'), completionDate: new Date('2021-03-10'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 230  },
          { name: 'Tipam Formation',  topDepth: 230,  bottomDepth: 880  },
          { name: 'Barail Formation', topDepth: 880,  bottomDepth: 1760 },
          { name: 'Kopili Formation', topDepth: 1760, bottomDepth: 2460 },
          { name: 'Formation-X',      topDepth: 2460, bottomDepth: 2980 },
        ],
        description: 'Producing well. Encountered moderate lost circulation in Formation-X.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-107', field: 'Deohal Field',
        latitude: 27.3920, longitude: 95.3420, status: 'DRILLING',
        currentDepth: 1950, targetDepth: 3200, currentFormation: 'Kopili Formation',
        riskLevel: 'MEDIUM', spudDate: new Date('2024-10-01'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 248  },
          { name: 'Tipam Formation',  topDepth: 248,  bottomDepth: 895  },
          { name: 'Barail Formation', topDepth: 895,  bottomDepth: 1795 },
          { name: 'Kopili Formation', topDepth: 1795, bottomDepth: 2495 },
          { name: 'Formation-X',      topDepth: 2495, bottomDepth: 3200 },
        ],
        description: 'Active well drilling through Kopili Formation.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-108', field: 'Moran Field',
        latitude: 27.4520, longitude: 95.2650, status: 'ABANDONED',
        currentDepth: 2100, targetDepth: 3000, currentFormation: 'Barail Formation',
        riskLevel: 'LOW', spudDate: new Date('2019-01-10'), completionDate: new Date('2019-09-20'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,   bottomDepth: 235  },
          { name: 'Tipam Formation',  topDepth: 235, bottomDepth: 875  },
          { name: 'Barail Formation', topDepth: 875, bottomDepth: 2100 },
        ],
        description: 'Abandoned at 2100m due to mechanical failure.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-109', field: 'Moran Field',
        latitude: 27.3400, longitude: 95.2800, status: 'TESTING',
        currentDepth: 3050, targetDepth: 3050, currentFormation: 'Formation-X',
        riskLevel: 'MEDIUM', spudDate: new Date('2023-11-01'), completionDate: new Date('2024-06-15'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 252  },
          { name: 'Tipam Formation',  topDepth: 252,  bottomDepth: 902  },
          { name: 'Barail Formation', topDepth: 902,  bottomDepth: 1802 },
          { name: 'Kopili Formation', topDepth: 1802, bottomDepth: 2502 },
          { name: 'Formation-X',      topDepth: 2502, bottomDepth: 3050 },
        ],
        description: 'Under DST testing in Formation-X zone.',
        createdBy: adminUser._id,
      },
      {
        wellName: 'WELL-110', field: 'Deohal Field',
        latitude: 27.3710, longitude: 95.2960, status: 'DRILLING',
        currentDepth: 3100, targetDepth: 3800, currentFormation: 'Formation-X',
        riskLevel: 'CRITICAL', spudDate: new Date('2024-05-20'),
        formations: [
          { name: 'Alluvium',         topDepth: 0,    bottomDepth: 258  },
          { name: 'Tipam Formation',  topDepth: 258,  bottomDepth: 908  },
          { name: 'Barail Formation', topDepth: 908,  bottomDepth: 1808 },
          { name: 'Kopili Formation', topDepth: 1808, bottomDepth: 2508 },
          { name: 'Formation-X',      topDepth: 2508, bottomDepth: 3200 },
          { name: 'Formation-Y',      topDepth: 3200, bottomDepth: 3800 },
        ],
        description: 'Active drilling. Approaching known high-pressure zone in Formation-X.',
        createdBy: adminUser._id,
      },
    ]);

    const well101 = wells[0];  // WELL-101 — active
    const well102 = wells[1];  // WELL-102
    const well103 = wells[2];  // WELL-103 — key offset well
    const well104 = wells[3];  // WELL-104 — kick history
    const well106 = wells[5];  // WELL-106
    const well107 = wells[6];  // WELL-107 — active
    const well110 = wells[9];  // WELL-110 — critical active
    console.log(`✅ Created ${wells.length} wells`);

    // ── DEMO REPORT ──────────────────────────────────────────────────────────
    const demoReport = await Report.create({
      title: 'WELL-103 Daily Drilling Report — Formation-X Interval',
      fileName: 'well103-ddr-demo.pdf',
      filePath: 'uploads/reports/well103-ddr-demo.pdf',
      fileSize: 245000, mimeType: 'application/pdf',
      wellId: well103._id, wellName: 'WELL-103',
      reportType: 'DAILY_DRILLING_REPORT',
      uploadedBy: adminUser._id,
      extractionStatus: 'COMPLETED',
      verificationStatus: 'PARTIALLY_APPROVED',
      rawText: `DAILY DRILLING REPORT — WELL-103
REPRESENTATIVE DEMONSTRATION DATA — NOT REAL OIL INDIA OPERATIONAL DATA
Date: 14th March 2023 | Well: WELL-103, Deohal Field | Depth: 2845m-2875m

MUD LOSS INCIDENT at 2850m:
Partial mud loss detected while drilling through Formation-X carbonate at 2850m depth.
Loss rate: 25-30 bbl/hr. Natural fracturing in Formation-X limestone observed.
Actions: Drilling stopped. LCM pill pumped. Mud weight maintained at 1.32 SG.
Mitigation: 50 bbl fibrous/granular LCM mix spotted at loss zone.
NPT: 6.5 hours. Formation-X carbonate zone highly fractured.

TORQUE SPIKE at 2880m:
Torque increased from 14 kNm to 22 kNm. Formation-X fracture encounter.
NPT: 2.5 hours. Reduced WOB and increased circulation to resolve.

STUCK PIPE at 2920m:
Pipe differentially stuck in Formation-X. Diesel oil pill spotted. Freed after 4 hours.
NPT: 4.0 hours.`,
      pageCount: 14, version: 1, isDemo: true, indexedInRAG: false,
      sourceMetadata: { originalName: 'well103-ddr-demo.pdf' },
      extractedData: [
        {
          eventType: 'MUD_LOSS', depth: 2850, formation: 'Formation-X', severity: 'HIGH',
          description: 'Partial mud loss at 2850m in Formation-X carbonate. Loss rate 25-30 bbl/hr. Natural fracturing observed.',
          mitigation: 'LCM pill (50 bbl fibrous/granular mix). Pump rates reduced. Mud weight 1.32 SG.',
          sourcePage: 14, confidence: 0.95, verificationStatus: 'APPROVED',
          verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-15'),
        },
        {
          eventType: 'HIGH_TORQUE', depth: 2880, formation: 'Formation-X', severity: 'MEDIUM',
          description: 'Torque spike from 14 to 22 kNm at 2880m. Natural fracture encounter in Formation-X.',
          mitigation: 'Reduced WOB, increased circulation. Normal drilling resumed after 2.5 hrs.',
          sourcePage: 14, confidence: 0.90, verificationStatus: 'APPROVED',
          verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-15'),
        },
        {
          eventType: 'STUCK_PIPE', depth: 2920, formation: 'Formation-X', severity: 'HIGH',
          description: 'Pipe differentially stuck at 2920m in Formation-X. Duration: 4 hours.',
          mitigation: 'Diesel oil pill spotted, worked pipe, gradually freed. NPT: 4 hours.',
          sourcePage: 14, confidence: 0.88, verificationStatus: 'PENDING',
        },
      ],
    });
    console.log('✅ Created demo report');

    // ── DRILLING EVENTS ───────────────────────────────────────────────────────
    const events = await DrillingEvent.insertMany([
      {
        wellId: well103._id, eventType: 'MUD_LOSS', depth: 2850,
        formation: 'Formation-X', severity: 'HIGH',
        description: 'Partial mud loss detected while drilling through Formation-X carbonate zone at 2850m. Loss rate: 25-30 bbl/hr. Natural fracturing of carbonate observed.',
        cause: 'Natural fracture system in Formation-X carbonate zone.',
        mitigation: 'Drilling stopped. LCM pill (50 bbl fibrous/granular mix) spotted at loss zone. Pump rates reduced. Mud weight maintained at 1.32 SG.',
        outcome: 'Drilling resumed after 6.5 hours NPT. Modified mud program implemented.',
        nptHours: 6.5,
        parameters: { torque: 18.5, rpm: 45, wob: 180, rop: 2.8, mudWeight: 1.32, pressure: 185 },
        startTime: new Date('2023-03-14T14:32:00'), endTime: new Date('2023-03-14T21:02:00'),
        sourceDocumentId: demoReport._id, sourcePage: 14,
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-15'),
      },
      {
        wellId: well103._id, eventType: 'HIGH_TORQUE', depth: 2880,
        formation: 'Formation-X', severity: 'MEDIUM',
        description: 'Torque spike at 2880m. Torque increased from 14 kNm to 22 kNm over 15 minutes. Natural fracture encounter.',
        cause: 'Natural fracture/fault encounter in Formation-X carbonate.',
        mitigation: 'Reduced WOB, increased circulation. Normal drilling resumed.',
        outcome: 'Normal drilling after 2.5 hours.', nptHours: 2.5,
        parameters: { torque: 22.0, rpm: 40, wob: 150, rop: 1.5, mudWeight: 1.32, pressure: 192 },
        startTime: new Date('2023-03-15T08:20:00'), endTime: new Date('2023-03-15T10:50:00'),
        sourceDocumentId: demoReport._id, sourcePage: 14,
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-15'),
      },
      {
        wellId: well103._id, eventType: 'STUCK_PIPE', depth: 2920,
        formation: 'Formation-X', severity: 'HIGH',
        description: 'Pipe differentially stuck at 2920m in Formation-X. Differential pressure sticking due to high-permeability fractures.',
        cause: 'Differential pressure sticking against permeable fractures.',
        mitigation: 'Diesel oil pill spotted. Worked pipe. Freed after 4 hours.',
        outcome: 'Pipe freed. NPT: 4 hours.', nptHours: 4.0,
        parameters: { torque: 24.0, rpm: 0, wob: 0, rop: 0, mudWeight: 1.34, pressure: 195 },
        startTime: new Date('2023-03-16T10:15:00'), endTime: new Date('2023-03-16T14:15:00'),
        sourceDocumentId: demoReport._id, sourcePage: 14,
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-15'),
      },
      {
        wellId: well103._id, eventType: 'LOST_CIRCULATION', depth: 2760,
        formation: 'Formation-X', severity: 'MEDIUM',
        description: 'Minor lost circulation at formation top. Loss rate 8-10 bbl/hr.',
        cause: 'Entry into Formation-X fracture zone.',
        mitigation: 'Increased LCM concentration. Monitoring continued.',
        outcome: 'Resolved within 1.5 hours.', nptHours: 1.5,
        sourceDocumentId: demoReport._id, sourcePage: 10,
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-15'),
      },
      {
        wellId: well104._id, eventType: 'KICK', depth: 2900,
        formation: 'Formation-X', severity: 'CRITICAL',
        description: 'Well kick at 2900m in Formation-X. 15 bbl kick volume. Well shut-in. SICP 380 psi, SIDPP 320 psi.',
        cause: 'Underbalanced condition. Formation gas influx in over-pressured Formation-X.',
        mitigation: 'Immediate well shut-in. Driller\'s method applied. Kill mud weight increased to 1.45 SG.',
        outcome: 'Well killed after 18 hours. Operations suspended.', nptHours: 18.0,
        parameters: { mudWeight: 1.38, pressure: 380 },
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-20'),
      },
      {
        wellId: well106._id, eventType: 'LOST_CIRCULATION', depth: 2780,
        formation: 'Formation-X', severity: 'MEDIUM',
        description: 'Moderate lost circulation in Formation-X. Loss rate 15-20 bbl/hr.',
        cause: 'Natural fracture zone in Formation-X carbonate.',
        mitigation: 'Reduced pump pressure. LCM pill. Reduced mud weight to 1.28 SG.',
        outcome: 'Circulation restored.', nptHours: 3.0,
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-02-01'),
      },
      {
        wellId: well102._id, eventType: 'CEMENTING_PROBLEM', depth: 1850,
        formation: 'Kopili Formation', severity: 'MEDIUM',
        description: 'Poor cement bond in Kopili Formation. CBL/VDL logs showed poor bond over 80m.',
        cause: 'Gas cut cement due to high formation gas influx.',
        mitigation: 'Remedial squeeze cementing. Two squeeze attempts required.',
        outcome: 'Acceptable bond achieved. NPT: 12 hours.', nptHours: 12.0,
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-25'),
      },
      {
        wellId: well102._id, eventType: 'OVERPRESSURE', depth: 2650,
        formation: 'Formation-X', severity: 'HIGH',
        description: 'Abnormal pressure at 2650m. SPP increased by 45 bar. ECD elevated.',
        cause: 'Over-pressured section in upper Formation-X.',
        mitigation: 'Increased mud weight from 1.30 to 1.38 SG. Reduced ROP.',
        outcome: 'Pressure managed. Continued drilling to TD.', nptHours: 8.0,
        parameters: { mudWeight: 1.38, pressure: 215 },
        verificationStatus: 'APPROVED', createdBy: adminUser._id,
        verifiedBy: adminUser._id, verifiedAt: new Date('2024-01-28'),
      },
    ]);
    console.log(`✅ Created ${events.length} drilling events`);

    // ── DRILLING READINGS ─────────────────────────────────────────────────────
    const readings = [];
    const baseTime = new Date('2024-11-01T06:00:00');
    for (let i = 0; i < 150; i++) {
      const depth = parseFloat((2680 + i * 0.95).toFixed(1));
      const t = new Date(baseTime.getTime() + i * 12 * 60000);
      const inFX = depth >= 2800;
      readings.push({
        wellId: well101._id, timestamp: t, depth,
        torque:     parseFloat((13.5 + Math.sin(i*0.3)*2.5 + (inFX?2.5:0) + (Math.random()-0.5)*1.2).toFixed(2)),
        rpm:        parseFloat((65 + Math.sin(i*0.2)*5 + (Math.random()-0.5)*3).toFixed(1)),
        wob:        parseFloat((185 + Math.cos(i*0.25)*15 + (Math.random()-0.5)*8).toFixed(1)),
        rop:        parseFloat((3.2 + Math.sin(i*0.15)*0.8 - (inFX?0.5:0) + (Math.random()-0.5)*0.3).toFixed(2)),
        mudWeight:  parseFloat((1.31 + (inFX?0.01:0) + (Math.random()-0.5)*0.004).toFixed(3)),
        mudFlow:    parseFloat((430 + Math.sin(i*0.2)*20 + (Math.random()-0.5)*8).toFixed(1)),
        pressure:   parseFloat((175 + Math.sin(i*0.25)*10 + (inFX?8:0) + (Math.random()-0.5)*4).toFixed(1)),
        temperature:parseFloat((68 + depth*0.015 + (Math.random()-0.5)*1.5).toFixed(1)),
        hookLoad:   parseFloat((285 + (Math.random()-0.5)*7).toFixed(1)),
        isDemo: true,
      });
    }
    // WELL-107 readings
    for (let i = 0; i < 80; i++) {
      const depth = parseFloat((1900 + i * 0.62).toFixed(1));
      readings.push({
        wellId: well107._id, timestamp: new Date(new Date('2024-11-10T08:00:00').getTime() + i*15*60000),
        depth,
        torque:     parseFloat((10.5 + Math.sin(i*0.3)*1.5 + (Math.random()-0.5)*0.8).toFixed(2)),
        rpm:        parseFloat((70 + Math.sin(i*0.2)*5 + (Math.random()-0.5)*2.5).toFixed(1)),
        wob:        parseFloat((170 + Math.cos(i*0.25)*12 + (Math.random()-0.5)*6).toFixed(1)),
        rop:        parseFloat((4.5 + Math.sin(i*0.15)*0.7 + (Math.random()-0.5)*0.25).toFixed(2)),
        mudWeight:  parseFloat((1.22 + (Math.random()-0.5)*0.003).toFixed(3)),
        mudFlow:    parseFloat((445 + (Math.random()-0.5)*9).toFixed(1)),
        pressure:   parseFloat((155 + Math.sin(i*0.25)*8 + (Math.random()-0.5)*3).toFixed(1)),
        temperature:parseFloat((55 + depth*0.012 + (Math.random()-0.5)*1.2).toFixed(1)),
        hookLoad:   parseFloat((270 + (Math.random()-0.5)*6).toFixed(1)),
        isDemo: true,
      });
    }
    // WELL-110 readings (critical)
    for (let i = 0; i < 60; i++) {
      const depth = parseFloat((3050 + i * 0.85).toFixed(1));
      readings.push({
        wellId: well110._id, timestamp: new Date(new Date('2024-11-12T06:00:00').getTime() + i*18*60000),
        depth,
        torque:     parseFloat((16.5 + Math.sin(i*0.3)*3.5 + (Math.random()-0.5)*2.0).toFixed(2)),
        rpm:        parseFloat((55 + Math.sin(i*0.2)*6 + (Math.random()-0.5)*3).toFixed(1)),
        wob:        parseFloat((195 + Math.cos(i*0.25)*18 + (Math.random()-0.5)*10).toFixed(1)),
        rop:        parseFloat((2.1 + Math.sin(i*0.15)*0.5 + (Math.random()-0.5)*0.25).toFixed(2)),
        mudWeight:  parseFloat((1.38 + (Math.random()-0.5)*0.005).toFixed(3)),
        mudFlow:    parseFloat((415 + (Math.random()-0.5)*12).toFixed(1)),
        pressure:   parseFloat((198 + Math.sin(i*0.25)*12 + (Math.random()-0.5)*5).toFixed(1)),
        temperature:parseFloat((82 + depth*0.016 + (Math.random()-0.5)*1.8).toFixed(1)),
        hookLoad:   parseFloat((298 + (Math.random()-0.5)*8).toFixed(1)),
        isDemo: true,
      });
    }
    await DrillingReading.insertMany(readings);
    console.log(`✅ Created ${readings.length} drilling readings`);

    // ── RISK ALERTS ───────────────────────────────────────────────────────────
    const mudLossEvent = events[0];
    const torqueEvent  = events[1];
    const kickEvent    = events[4];

    await RiskAlert.insertMany([
      {
        activeWellId: well101._id, offsetWellId: well103._id, eventId: mudLossEvent._id,
        activeWellName: 'WELL-101', offsetWellName: 'WELL-103',
        currentDepth: 2820, historicalDepth: 2850, depthDifference: 30,
        distance: 2.1, formationSimilarity: 'HIGH',
        riskLevel: 'HIGH', riskScore: 82.5, eventType: 'MUD_LOSS',
        reason: 'Current drilling depth (2820m) is 30m from a historically recorded MUD LOSS event in WELL-103 (2.1 km away) with HIGH formation similarity. Both wells share Formation-X (Limestone/Dolomite) carbonate zone with known fracture networks.',
        riskFactors: [
          { factor: 'Depth Proximity',    value: '30m difference', weight: 35, contribution: 28 },
          { factor: 'Geographic Distance', value: '2.1 km',         weight: 25, contribution: 22 },
          { factor: 'Formation Similarity',value: 'HIGH',           weight: 25, contribution: 25 },
          { factor: 'Event Severity',      value: 'HIGH',           weight: 15, contribution: 12 },
        ],
        evidence: [{
          documentId: demoReport._id,
          documentTitle: 'WELL-103 Daily Drilling Report — Formation-X Interval',
          page: 14,
          text: 'Partial mud loss detected at 2850m in Formation-X carbonate. Loss rate 25-30 bbl/hr.',
        }],
        status: 'OPEN', isActive: true,
      },
      {
        activeWellId: well101._id, offsetWellId: well103._id, eventId: torqueEvent._id,
        activeWellName: 'WELL-101', offsetWellName: 'WELL-103',
        currentDepth: 2820, historicalDepth: 2880, depthDifference: 60,
        distance: 2.1, formationSimilarity: 'HIGH',
        riskLevel: 'MEDIUM', riskScore: 65.0, eventType: 'HIGH_TORQUE',
        reason: 'High torque event recorded at 2880m in WELL-103. Current depth 2820m — approaching this interval.',
        riskFactors: [
          { factor: 'Depth Proximity',    value: '60m difference', weight: 35, contribution: 20 },
          { factor: 'Geographic Distance', value: '2.1 km',         weight: 25, contribution: 22 },
          { factor: 'Formation Similarity',value: 'HIGH',           weight: 25, contribution: 25 },
          { factor: 'Event Severity',      value: 'MEDIUM',         weight: 15, contribution: 7  },
        ],
        evidence: [{ documentId: demoReport._id, documentTitle: 'WELL-103 DDR', page: 14, text: 'Torque spike at 2880m in Formation-X. 14 to 22 kNm.' }],
        status: 'OPEN', isActive: true,
      },
      {
        activeWellId: well110._id, offsetWellId: well104._id, eventId: kickEvent._id,
        activeWellName: 'WELL-110', offsetWellName: 'WELL-104',
        currentDepth: 3100, historicalDepth: 2900, depthDifference: 200,
        distance: 3.8, formationSimilarity: 'HIGH',
        riskLevel: 'CRITICAL', riskScore: 88.0, eventType: 'KICK',
        reason: 'WELL-110 drilling at 3100m in Formation-X. WELL-104 had critical kick at 2900m (already passed). Known overpressure zone ahead.',
        riskFactors: [
          { factor: 'Formation Similarity', value: 'HIGH',     weight: 25, contribution: 25 },
          { factor: 'Event Severity',        value: 'CRITICAL', weight: 15, contribution: 15 },
          { factor: 'Geographic Distance',   value: '3.8 km',   weight: 25, contribution: 18 },
        ],
        evidence: [], status: 'OPEN', isActive: true,
      },
      {
        activeWellId: well107._id, offsetWellId: well103._id, eventId: events[3]._id,
        activeWellName: 'WELL-107', offsetWellName: 'WELL-103',
        currentDepth: 1950, historicalDepth: 2760, depthDifference: 810,
        distance: 4.2, formationSimilarity: 'MEDIUM',
        riskLevel: 'LOW', riskScore: 28.0, eventType: 'LOST_CIRCULATION',
        reason: 'Minor lost circulation at 2760m in WELL-103. WELL-107 will approach this interval soon.',
        riskFactors: [],
        evidence: [], status: 'ACKNOWLEDGED',
        acknowledgedBy: engineerUser._id,
        acknowledgedAt: new Date('2024-11-08T09:30:00'),
        acknowledgedNote: 'Noted. LCM material pre-positioned on site.',
        isActive: true,
      },
    ]);
    console.log('✅ Created risk alerts');

    // ── AUDIT LOGS ────────────────────────────────────────────────────────────
    await AuditLog.insertMany([
      { userId: adminUser._id, userName: 'Admin Kumar', userRole: 'ADMIN', action: 'REGISTER', entityType: 'System', details: { message: 'System seeded' }, timestamp: new Date() },
      { userId: adminUser._id, userName: 'Admin Kumar', userRole: 'ADMIN', action: 'REPORT_UPLOADED', entityType: 'Report', entityId: demoReport._id.toString(), details: { fileName: 'well103-ddr-demo.pdf' }, timestamp: new Date(Date.now() - 7*24*3600000) },
      { userId: adminUser._id, userName: 'Admin Kumar', userRole: 'ADMIN', action: 'REPORT_PROCESSED', entityType: 'Report', entityId: demoReport._id.toString(), details: { eventCount: 3 }, timestamp: new Date(Date.now() - 6*24*3600000) },
      { userId: adminUser._id, userName: 'Admin Kumar', userRole: 'ADMIN', action: 'DATA_APPROVED', entityType: 'Report', entityId: demoReport._id.toString(), details: { eventType: 'MUD_LOSS', depth: 2850 }, timestamp: new Date(Date.now() - 5*24*3600000) },
      { userId: adminUser._id, userName: 'Admin Kumar', userRole: 'ADMIN', action: 'DATA_APPROVED', entityType: 'Report', entityId: demoReport._id.toString(), details: { eventType: 'HIGH_TORQUE', depth: 2880 }, timestamp: new Date(Date.now() - 5*24*3600000 + 3600000) },
      { userId: engineerUser._id, userName: 'Rajesh Engineer', userRole: 'ENGINEER', action: 'LOGIN', entityType: 'User', details: { email: 'engineer@ertmac.demo' }, timestamp: new Date(Date.now() - 2*3600000) },
      { userId: engineerUser._id, userName: 'Rajesh Engineer', userRole: 'ENGINEER', action: 'RISK_ACKNOWLEDGED', entityType: 'RiskAlert', details: { riskLevel: 'LOW', wellName: 'WELL-107' }, timestamp: new Date(Date.now() - 1*3600000) },
    ]);
    console.log('✅ Created audit logs');

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          eRTMAC-NWIS SEED COMPLETE ✅                   ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  DEMO CREDENTIALS (Representative Data Only)            ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  Admin:    admin@ertmac.demo     / Demo@2024            ║');
    console.log('║  Engineer: engineer@ertmac.demo  / Demo@2024            ║');
    console.log('║  Manager:  manager@ertmac.demo   / Demo@2024            ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  DEMO SCENARIO:                                         ║');
    console.log('║  WELL-101 at 2820m → 30m from WELL-103 mud loss (2850m)║');
    console.log('║  Formation-X · 2.1km distance · HIGH RISK ALERT        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    if (shouldDisconnect) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error.stack);
    if (shouldDisconnect) {
      try { await mongoose.disconnect(); } catch {}
      process.exit(1);
    }
  }
}

if (require.main === module) {
  seed(true);
}

module.exports = seed;
