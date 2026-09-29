const Well = require('../models/Well');
const DrillingEvent = require('../models/DrillingEvent');
const RiskAlert = require('../models/RiskAlert');
const DrillingReading = require('../models/DrillingReading');
const Report = require('../models/Report');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const RAGDocument = require('../models/RAGDocument');
const axios = require('axios');
const os = require('os');
const geminiService = require('../services/geminiService');

exports.getOverview = async (req, res) => {
  try {
    const [
      totalWells, activeWells, highRiskWells, openAlerts, ackAlerts,
      totalEvents, pendingReviews, totalUsers,
    ] = await Promise.all([
      Well.countDocuments({ isActive: true }),
      Well.countDocuments({ status: 'DRILLING', isActive: true }),
      Well.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] }, isActive: true }),
      RiskAlert.countDocuments({ status: 'OPEN' }),
      RiskAlert.countDocuments({ status: 'ACKNOWLEDGED' }),
      DrillingEvent.countDocuments({ verificationStatus: 'APPROVED' }),
      Report.countDocuments({ verificationStatus: 'PENDING_REVIEW' }),
      User.countDocuments({ status: 'ACTIVE' }),
    ]);

    const riskDistribution = await RiskAlert.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
    ]);

    const eventTypeDistribution = await DrillingEvent.aggregate([
      { $match: { verificationStatus: 'APPROVED' } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        metrics: { totalWells, activeWells, highRiskWells, openAlerts, ackAlerts, totalEvents, pendingReviews, totalUsers },
        riskDistribution,
        eventTypeDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch overview.' });
  }
};

exports.getWellAnalytics = async (req, res) => {
  try {
    const { wellId, startDepth, endDepth } = req.query;
    const filter = {};
    if (wellId) filter.wellId = wellId;
    if (startDepth || endDepth) {
      filter.depth = {};
      if (startDepth) filter.depth.$gte = parseFloat(startDepth);
      if (endDepth) filter.depth.$lte = parseFloat(endDepth);
    }

    const readings = await DrillingReading.find(filter).sort({ depth: 1 }).limit(500);
    const events = await DrillingEvent.find({ ...filter, verificationStatus: 'APPROVED' }).sort({ depth: 1 });

    res.json({ success: true, data: { readings, events } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch well analytics.' });
  }
};

exports.getEventAnalytics = async (req, res) => {
  try {
    const byType = await DrillingEvent.aggregate([
      { $match: { verificationStatus: 'APPROVED' } },
      { $group: { _id: '$eventType', count: { $sum: 1 }, avgDepth: { $avg: '$depth' }, totalNPT: { $sum: '$nptHours' } } },
      { $sort: { count: -1 } },
    ]);

    const byFormation = await DrillingEvent.aggregate([
      { $match: { verificationStatus: 'APPROVED', formation: { $ne: null } } },
      { $group: { _id: '$formation', count: { $sum: 1 }, eventTypes: { $addToSet: '$eventType' } } },
      { $sort: { count: -1 } },
    ]);

    const bySeverity = await DrillingEvent.aggregate([
      { $match: { verificationStatus: 'APPROVED' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, data: { byType, byFormation, bySeverity } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event analytics.' });
  }
};

exports.getRiskAnalytics = async (req, res) => {
  try {
    const byLevel = await RiskAlert.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 }, avgScore: { $avg: '$riskScore' } } },
    ]);

    const byStatus = await RiskAlert.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const recentAlerts = await RiskAlert.find({ status: 'OPEN' })
      .populate('activeWellId', 'wellName field')
      .sort({ createdAt: -1 })
      .limit(10);

    const avgAckTime = await RiskAlert.aggregate([
      { $match: { status: 'ACKNOWLEDGED', acknowledgedAt: { $exists: true } } },
      { $project: { ackTime: { $subtract: ['$acknowledgedAt', '$createdAt'] } } },
      { $group: { _id: null, avgMs: { $avg: '$ackTime' } } },
    ]);

    res.json({ success: true, data: { byLevel, byStatus, recentAlerts, avgAckTimeMs: avgAckTime[0]?.avgMs || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch risk analytics.' });
  }
};

exports.getFormationAnalytics = async (req, res) => {
  try {
    const formationRisks = await DrillingEvent.aggregate([
      { $match: { verificationStatus: 'APPROVED', formation: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$formation',
          totalEvents: { $sum: 1 },
          eventTypes: { $addToSet: '$eventType' },
          avgDepth: { $avg: '$depth' },
          maxSeverity: { $max: '$severity' },
          totalNPT: { $sum: '$nptHours' },
        },
      },
      { $sort: { totalEvents: -1 } },
    ]);

    res.json({ success: true, data: formationRisks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch formation analytics.' });
  }
};

exports.getNPTAnalytics = async (req, res) => {
  try {
    const nptByType = await DrillingEvent.aggregate([
      { $match: { verificationStatus: 'APPROVED', nptHours: { $gt: 0 } } },
      { $group: { _id: '$eventType', totalNPT: { $sum: '$nptHours' }, count: { $sum: 1 } } },
      { $sort: { totalNPT: -1 } },
    ]);

    const nptByWell = await DrillingEvent.aggregate([
      { $match: { verificationStatus: 'APPROVED', nptHours: { $gt: 0 } } },
      { $group: { _id: '$wellId', totalNPT: { $sum: '$nptHours' }, count: { $sum: 1 } } },
      { $lookup: { from: 'wells', localField: '_id', foreignField: '_id', as: 'well' } },
      { $unwind: '$well' },
      { $project: { wellName: '$well.wellName', totalNPT: 1, count: 1 } },
      { $sort: { totalNPT: -1 } },
    ]);

    res.json({ success: true, data: { nptByType, nptByWell } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch NPT analytics.' });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';

    // Gemini status is determined directly from the API key — no AI service ping needed
    const geminiConfigured = geminiService.isConfigured();
    const geminiStatus = geminiConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED';

    let aiStatus = 'UNAVAILABLE';
    let faissStatus = 'NOT_INDEXED';

    try {
      const healthResp = await axios.get(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/health`, { timeout: 5000 });
      aiStatus = healthResp.data.status === 'ok' ? 'HEALTHY' : 'DEGRADED';
      faissStatus = healthResp.data.faiss_indexed ? 'INDEXED' : 'NOT_INDEXED';
    } catch (e) {
      // Python AI service offline — Gemini still works via direct Node.js integration
      aiStatus = geminiConfigured ? 'DEGRADED' : 'UNAVAILABLE';
    }

    const ragDocCount = await RAGDocument.countDocuments({ isVerified: true });
    const totalDocs = await Report.countDocuments();
    const totalEvents = await DrillingEvent.countDocuments({ verificationStatus: 'APPROVED' });

    res.json({
      success: true,
      data: {
        services: {
          mongodb: { status: mongoStatus, message: mongoStatus === 'CONNECTED' ? 'Operational' : 'Connection lost' },
          backend: { status: 'HEALTHY', message: 'Operational', uptime: process.uptime(), memory: process.memoryUsage() },
          aiService: {
            status: aiStatus,
            message: aiStatus === 'HEALTHY' ? 'FastAPI service operational' : aiStatus === 'DEGRADED' ? 'Gemini active via direct integration' : 'AI service offline',
          },
          gemini: {
            status: geminiStatus,
            message: geminiConfigured ? `API key configured · Model: ${geminiService.GEMINI_MODEL}` : 'Set GEMINI_API_KEY in server .env',
          },
          faiss: { status: faissStatus, message: `${ragDocCount} verified chunks indexed` },
        },
        stats: { ragDocCount, totalDocs, totalEvents },
        system: { platform: os.platform(), cpus: os.cpus().length, freeMemory: os.freemem(), totalMemory: os.totalmem() },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Health check failed.' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, userId, entityType, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (entityType) filter.entityType = entityType;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
};

exports.getDataQuality = async (req, res) => {
  try {
    const [
      eventsWithoutDepth, eventsWithoutFormation, wellsWithoutCoords,
      duplicateEvents, unverifiedDocs, pendingExtractions,
    ] = await Promise.all([
      DrillingEvent.countDocuments({ depth: { $exists: false } }),
      DrillingEvent.countDocuments({ $or: [{ formation: { $exists: false } }, { formation: null }, { formation: '' }] }),
      Well.countDocuments({ $or: [{ latitude: { $exists: false } }, { longitude: { $exists: false } }] }),
      DrillingEvent.aggregate([
        { $group: { _id: { wellId: '$wellId', eventType: '$eventType', depth: '$depth' }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'total' },
      ]),
      Report.countDocuments({ verificationStatus: 'PENDING_REVIEW' }),
      Report.countDocuments({ extractionStatus: 'PENDING' }),
    ]);

    const issues = [];
    if (eventsWithoutDepth > 0) issues.push({ type: 'MISSING_DEPTH', count: eventsWithoutDepth, severity: 'HIGH', message: `${eventsWithoutDepth} drilling events missing depth information.` });
    if (eventsWithoutFormation > 0) issues.push({ type: 'MISSING_FORMATION', count: eventsWithoutFormation, severity: 'MEDIUM', message: `${eventsWithoutFormation} events missing formation data.` });
    if (wellsWithoutCoords > 0) issues.push({ type: 'MISSING_COORDINATES', count: wellsWithoutCoords, severity: 'HIGH', message: `${wellsWithoutCoords} wells missing geographic coordinates.` });
    if (duplicateEvents[0]?.total > 0) issues.push({ type: 'DUPLICATE_EVENTS', count: duplicateEvents[0].total, severity: 'MEDIUM', message: `Potential duplicate event records detected.` });
    if (unverifiedDocs > 0) issues.push({ type: 'UNVERIFIED_DOCS', count: unverifiedDocs, severity: 'INFO', message: `${unverifiedDocs} documents awaiting admin verification.` });
    if (pendingExtractions > 0) issues.push({ type: 'PENDING_EXTRACTIONS', count: pendingExtractions, severity: 'INFO', message: `${pendingExtractions} documents pending AI extraction.` });

    const score = Math.max(0, 100 - issues.reduce((acc, i) => acc + (i.severity === 'HIGH' ? 15 : i.severity === 'MEDIUM' ? 8 : 3), 0));

    res.json({ success: true, data: { issues, qualityScore: score, timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Data quality check failed.' });
  }
};
