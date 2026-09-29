const DrillingEvent = require('../models/DrillingEvent');
const Well = require('../models/Well');
const auditLog = require('../middleware/auditLog');

exports.getEvents = async (req, res) => {
  try {
    const { wellId, eventType, formation, severity, verificationStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (wellId) filter.wellId = wellId;
    if (eventType) filter.eventType = eventType;
    if (formation) filter.formation = formation;
    if (severity) filter.severity = severity;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const total = await DrillingEvent.countDocuments(filter);
    const events = await DrillingEvent.find(filter)
      .populate('wellId', 'wellName field')
      .populate('sourceDocumentId', 'title fileName')
      .populate('verifiedBy', 'name')
      .sort({ depth: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: events, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch events.' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await DrillingEvent.findById(req.params.id)
      .populate('wellId', 'wellName field latitude longitude')
      .populate('sourceDocumentId', 'title fileName filePath')
      .populate('verifiedBy', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event.' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = await DrillingEvent.create({ ...req.body, createdBy: req.user._id });
    await auditLog(req.user._id, 'EVENT_CREATED', 'DrillingEvent', event._id, { eventType: event.eventType, depth: event.depth }, req);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    // Prevent changing verificationStatus directly through this endpoint
    const { verificationStatus, ...updateData } = req.body;
    const event = await DrillingEvent.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    await auditLog(req.user._id, 'EVENT_UPDATED', 'DrillingEvent', event._id, updateData, req);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    await DrillingEvent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
};

exports.getEventsByFormationAndDepth = async (req, res) => {
  try {
    const { formation, minDepth, maxDepth, wellId } = req.query;
    const filter = { verificationStatus: 'APPROVED' };
    if (formation) filter.formation = formation;
    if (minDepth || maxDepth) filter.depth = {};
    if (minDepth) filter.depth.$gte = parseFloat(minDepth);
    if (maxDepth) filter.depth.$lte = parseFloat(maxDepth);
    if (wellId) filter.wellId = { $ne: wellId }; // Exclude active well

    const events = await DrillingEvent.find(filter)
      .populate('wellId', 'wellName field latitude longitude')
      .sort({ depth: 1 });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch events.' });
  }
};
