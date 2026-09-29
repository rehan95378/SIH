const Well = require('../models/Well');
const DrillingEvent = require('../models/DrillingEvent');
const RiskAlert = require('../models/RiskAlert');
const auditLog = require('../middleware/auditLog');

// Haversine distance calculation (km)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

exports.getWells = async (req, res) => {
  try {
    const { field, status, lat, lon, radius, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (field) filter.field = field;
    if (status) filter.status = status;

    const wells = await Well.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Well.countDocuments(filter);

    // If lat/lon/radius provided, filter by distance
    let result = wells;
    if (lat && lon && radius) {
      result = wells.filter(w => haversineDistance(parseFloat(lat), parseFloat(lon), w.latitude, w.longitude) <= parseFloat(radius));
    }

    // Attach distance if active well provided
    if (lat && lon) {
      result = result.map(w => ({
        ...w.toObject(),
        distance: haversineDistance(parseFloat(lat), parseFloat(lon), w.latitude, w.longitude),
      }));
    }

    res.json({ success: true, data: result, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch wells.' });
  }
};

exports.getWellById = async (req, res) => {
  try {
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ success: false, message: 'Well not found.' });

    const events = await DrillingEvent.find({ wellId: well._id, verificationStatus: 'APPROVED' }).sort({ depth: 1 });
    const openAlerts = await RiskAlert.countDocuments({ activeWellId: well._id, status: 'OPEN' });

    res.json({ success: true, data: { ...well.toObject(), events, openAlerts } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch well.' });
  }
};

exports.createWell = async (req, res) => {
  try {
    const well = await Well.create({ ...req.body, createdBy: req.user._id });
    await auditLog(req.user._id, 'WELL_CREATED', 'Well', well._id, { wellName: well.wellName }, req);
    res.status(201).json({ success: true, data: well });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Well name already exists.' });
    res.status(500).json({ success: false, message: 'Failed to create well.' });
  }
};

exports.updateWell = async (req, res) => {
  try {
    const well = await Well.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!well) return res.status(404).json({ success: false, message: 'Well not found.' });
    await auditLog(req.user._id, 'WELL_UPDATED', 'Well', well._id, req.body, req);
    res.json({ success: true, data: well });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update well.' });
  }
};

exports.deleteWell = async (req, res) => {
  try {
    const well = await Well.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!well) return res.status(404).json({ success: false, message: 'Well not found.' });
    await auditLog(req.user._id, 'WELL_DELETED', 'Well', well._id, {}, req);
    res.json({ success: true, message: 'Well deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete well.' });
  }
};

exports.getNearbyWells = async (req, res) => {
  try {
    const { wellId, radius = 20 } = req.params;
    const { radius: qRadius } = req.query;
    const r = parseFloat(qRadius || radius);

    const activeWell = await Well.findById(wellId);
    if (!activeWell) return res.status(404).json({ success: false, message: 'Well not found.' });

    const allWells = await Well.find({ isActive: true, _id: { $ne: activeWell._id } });

    const nearby = allWells
      .map(w => ({
        ...w.toObject(),
        distance: haversineDistance(activeWell.latitude, activeWell.longitude, w.latitude, w.longitude),
      }))
      .filter(w => w.distance <= r)
      .sort((a, b) => a.distance - b.distance);

    // Get event counts for each nearby well
    const nearbyWithEvents = await Promise.all(nearby.map(async (w) => {
      const eventCount = await DrillingEvent.countDocuments({ wellId: w._id, verificationStatus: 'APPROVED' });
      const openAlerts = await RiskAlert.countDocuments({ offsetWellId: w._id, status: 'OPEN' });
      return { ...w, eventCount, openAlerts };
    }));

    res.json({ success: true, data: nearbyWithEvents, activeWell });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to get nearby wells.' });
  }
};

exports.getOffsetMatchScore = async (req, res) => {
  try {
    const { activeWellId, offsetWellId } = req.params;
    const [activeWell, offsetWell] = await Promise.all([
      Well.findById(activeWellId),
      Well.findById(offsetWellId),
    ]);
    if (!activeWell || !offsetWell) return res.status(404).json({ success: false, message: 'Well not found.' });

    const distance = haversineDistance(activeWell.latitude, activeWell.longitude, offsetWell.latitude, offsetWell.longitude);

    // Formation similarity
    const activeFormations = activeWell.formations.map(f => f.name.toLowerCase());
    const offsetFormations = offsetWell.formations.map(f => f.name.toLowerCase());
    const sharedFormations = activeFormations.filter(f => offsetFormations.includes(f));
    const formationSimilarity = sharedFormations.length > 0 ? 'HIGH' : 
      (activeFormations.some(af => offsetFormations.some(of => of.includes(af.split('-')[0]))) ? 'MEDIUM' : 'LOW');

    // Depth similarity
    const depthDiff = Math.abs(activeWell.currentDepth - offsetWell.currentDepth);
    const depthSimilarity = depthDiff < 200 ? 'HIGH' : depthDiff < 500 ? 'MEDIUM' : 'LOW';

    // Historical events
    const events = await DrillingEvent.find({ wellId: offsetWell._id, verificationStatus: 'APPROVED' });

    // Calculate overall score
    let score = 100;
    score -= Math.min(distance * 2, 30);
    if (formationSimilarity === 'HIGH') score += 20;
    else if (formationSimilarity === 'MEDIUM') score += 10;
    if (depthSimilarity === 'HIGH') score += 15;
    else if (depthSimilarity === 'MEDIUM') score += 7;
    if (events.length > 0) score += Math.min(events.length * 3, 15);
    score = Math.min(Math.max(score, 0), 100);

    const overallRelevance = score > 75 ? 'HIGH' : score > 50 ? 'MEDIUM' : 'LOW';

    res.json({
      success: true,
      data: {
        activeWell: { id: activeWell._id, name: activeWell.wellName, depth: activeWell.currentDepth },
        offsetWell: { id: offsetWell._id, name: offsetWell.wellName, depth: offsetWell.currentDepth },
        distance: parseFloat(distance.toFixed(2)),
        formationSimilarity,
        sharedFormations,
        depthSimilarity,
        depthDifference: depthDiff,
        historicalEventCount: events.length,
        events: events.map(e => ({ type: e.eventType, depth: e.depth, severity: e.severity })),
        score: parseFloat(score.toFixed(1)),
        overallRelevance,
        explanation: generateMatchExplanation(distance, formationSimilarity, depthSimilarity, events),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to calculate match score.' });
  }
};

function generateMatchExplanation(distance, formationSimilarity, depthSimilarity, events) {
  const parts = [];
  if (distance < 5) parts.push(`Very close proximity (${distance.toFixed(1)} km)`);
  else if (distance < 15) parts.push(`Moderate proximity (${distance.toFixed(1)} km)`);
  else parts.push(`Distance of ${distance.toFixed(1)} km`);

  if (formationSimilarity === 'HIGH') parts.push('matching formation characteristics');
  else if (formationSimilarity === 'MEDIUM') parts.push('partially matching formations');

  if (depthSimilarity === 'HIGH') parts.push('similar drilling depth');

  if (events.length > 0) {
    const types = [...new Set(events.map(e => e.eventType.replace(/_/g, ' ').toLowerCase()))];
    parts.push(`${events.length} recorded historical event(s) including ${types.slice(0, 2).join(', ')}`);
  }

  return `This offset well is relevant due to: ${parts.join(', ')}.`;
}
