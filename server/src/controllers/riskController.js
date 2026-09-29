const Well = require('../models/Well');
const DrillingEvent = require('../models/DrillingEvent');
const RiskAlert = require('../models/RiskAlert');
const auditLog = require('../middleware/auditLog');

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Prototype historical-risk scoring model
const calculateRiskScore = (activeWell, offsetWell, event, distance) => {
  const factors = [];
  let score = 0;

  // Factor 1: Depth proximity (0-35 points)
  const depthDiff = Math.abs(activeWell.currentDepth - event.depth);
  let depthScore = 0;
  if (depthDiff <= 20) depthScore = 35;
  else if (depthDiff <= 50) depthScore = 28;
  else if (depthDiff <= 100) depthScore = 20;
  else if (depthDiff <= 200) depthScore = 12;
  else if (depthDiff <= 400) depthScore = 6;
  else depthScore = 0;
  score += depthScore;
  factors.push({ factor: 'Depth Proximity', value: `${depthDiff.toFixed(0)}m difference`, weight: 35, contribution: depthScore });

  // Factor 2: Geographic distance (0-25 points)
  let distScore = 0;
  if (distance <= 2) distScore = 25;
  else if (distance <= 5) distScore = 20;
  else if (distance <= 10) distScore = 14;
  else if (distance <= 20) distScore = 8;
  else distScore = 3;
  score += distScore;
  factors.push({ factor: 'Geographic Distance', value: `${distance.toFixed(1)} km`, weight: 25, contribution: distScore });

  // Factor 3: Formation similarity (0-25 points)
  const activeFormations = (activeWell.formations || []).map(f => f.name.toLowerCase());
  const activeCurrentFormation = (activeWell.currentFormation || '').toLowerCase();
  const eventFormation = (event.formation || '').toLowerCase();
  let formScore = 0;
  let formSimilarity = 'NONE';
  if (eventFormation && (activeFormations.includes(eventFormation) || activeCurrentFormation === eventFormation)) {
    formScore = 25;
    formSimilarity = 'HIGH';
  } else if (eventFormation && activeFormations.some(f => f.includes(eventFormation.split('-')[0]) || eventFormation.includes(f.split('-')[0]))) {
    formScore = 12;
    formSimilarity = 'MEDIUM';
  } else {
    formSimilarity = 'LOW';
    formScore = 2;
  }
  score += formScore;
  factors.push({ factor: 'Formation Similarity', value: formSimilarity, weight: 25, contribution: formScore });

  // Factor 4: Event severity (0-15 points)
  const severityScore = { CRITICAL: 15, HIGH: 12, MEDIUM: 7, LOW: 3 };
  const sevScore = severityScore[event.severity] || 5;
  score += sevScore;
  factors.push({ factor: 'Event Severity', value: event.severity, weight: 15, contribution: sevScore });

  const riskLevel = score >= 75 ? 'CRITICAL' : score >= 55 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';

  return { score, riskLevel, factors, formSimilarity, depthDiff };
};

exports.getRisks = async (req, res) => {
  try {
    const { status, riskLevel, wellId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (wellId) filter.activeWellId = wellId;

    const total = await RiskAlert.countDocuments(filter);
    const risks = await RiskAlert.find(filter)
      .populate('activeWellId', 'wellName field currentDepth currentFormation')
      .populate('offsetWellId', 'wellName field')
      .populate('acknowledgedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: risks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch risks.' });
  }
};

exports.getRisksByWell = async (req, res) => {
  try {
    const risks = await RiskAlert.find({ activeWellId: req.params.wellId })
      .populate('offsetWellId', 'wellName field latitude longitude')
      .populate('eventId')
      .populate('acknowledgedBy', 'name')
      .sort({ riskLevel: 1, createdAt: -1 });
    res.json({ success: true, data: risks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch risks for well.' });
  }
};

exports.calculateRisk = async (req, res) => {
  try {
    const { activeWellId, radius = 20 } = req.body;
    const activeWell = await Well.findById(activeWellId);
    if (!activeWell) return res.status(404).json({ success: false, message: 'Active well not found.' });

    const allWells = await Well.find({ isActive: true, _id: { $ne: activeWell._id } });
    const nearbyWells = allWells.filter(w =>
      haversineDistance(activeWell.latitude, activeWell.longitude, w.latitude, w.longitude) <= radius
    );

    const newAlerts = [];
    for (const offsetWell of nearbyWells) {
      const distance = haversineDistance(activeWell.latitude, activeWell.longitude, offsetWell.latitude, offsetWell.longitude);
      const events = await DrillingEvent.find({ wellId: offsetWell._id, verificationStatus: 'APPROVED' });

      for (const event of events) {
        const { score, riskLevel, factors, formSimilarity, depthDiff } = calculateRiskScore(activeWell, offsetWell, event, distance);

        if (riskLevel === 'LOW' && score < 25) continue;

        // Check if alert already exists
        const existing = await RiskAlert.findOne({
          activeWellId: activeWell._id,
          offsetWellId: offsetWell._id,
          eventId: event._id,
          status: 'OPEN',
        });
        if (existing) continue;

        const reason = `Current drilling depth (${activeWell.currentDepth}m) is ${depthDiff.toFixed(0)}m from a historically recorded ${event.eventType.replace(/_/g, ' ')} event in ${offsetWell.wellName} (${distance.toFixed(1)} km away) with ${formSimilarity.toLowerCase()} formation similarity.`;

        const alert = await RiskAlert.create({
          activeWellId: activeWell._id,
          offsetWellId: offsetWell._id,
          eventId: event._id,
          activeWellName: activeWell.wellName,
          offsetWellName: offsetWell.wellName,
          currentDepth: activeWell.currentDepth,
          historicalDepth: event.depth,
          depthDifference: depthDiff,
          distance: parseFloat(distance.toFixed(2)),
          formationSimilarity: formSimilarity,
          riskLevel,
          riskScore: parseFloat(score.toFixed(1)),
          eventType: event.eventType,
          reason,
          riskFactors: factors,
          evidence: event.sourceDocumentId ? [{
            documentId: event.sourceDocumentId,
            page: event.sourcePage,
            text: event.description,
          }] : [],
        });
        newAlerts.push(alert);

        await auditLog(null, 'ALERT_CREATED', 'RiskAlert', alert._id, { riskLevel, eventType: event.eventType }, req);
      }
    }

    // Update well risk level
    const highestRisk = newAlerts.reduce((max, a) => {
      const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      return levels.indexOf(a.riskLevel) > levels.indexOf(max) ? a.riskLevel : max;
    }, 'LOW');

    if (highestRisk !== 'LOW') {
      await Well.findByIdAndUpdate(activeWellId, { riskLevel: highestRisk });
    }

    res.json({ success: true, data: newAlerts, message: `${newAlerts.length} new risk alert(s) generated.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to calculate risk.' });
  }
};

exports.acknowledgeRisk = async (req, res) => {
  try {
    const { note } = req.body;
    const alert = await RiskAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date(),
        acknowledgedNote: note,
      },
      { new: true }
    ).populate('acknowledgedBy', 'name');

    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    await auditLog(req.user._id, 'RISK_ACKNOWLEDGED', 'RiskAlert', alert._id, { note }, req);
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to acknowledge alert.' });
  }
};
