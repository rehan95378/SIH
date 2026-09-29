require('dotenv').config();
require('dns').setServers(['8.8.8.8']);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

// Connect DB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(null, true); // Allow all in dev
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use('/api/auth', authLimiter);
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static uploads (protected - only for PDF serving via route)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wells', require('./routes/wells'));
app.use('/api/events', require('./routes/events'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/risks', require('./routes/risks'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/rag', require('./routes/rag'));
app.use('/api/admin', require('./routes/admin'));

// Drilling readings route
const DrillingReading = require('./models/DrillingReading');
const authMiddleware = require('./middleware/auth');

app.get('/api/readings/:wellId', authMiddleware, async (req, res) => {
  try {
    const { limit = 100, depth_start, depth_end } = req.query;
    const filter = { wellId: req.params.wellId };
    if (depth_start || depth_end) {
      filter.depth = {};
      if (depth_start) filter.depth.$gte = parseFloat(depth_start);
      if (depth_end) filter.depth.$lte = parseFloat(depth_end);
    }
    const readings = await DrillingReading.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch readings.' });
  }
});

// Knowledge graph endpoint
const Well = require('./models/Well');
const DrillingEvent = require('./models/DrillingEvent');
const Report = require('./models/Report');

app.get('/api/knowledge-graph', authMiddleware, async (req, res) => {
  try {
    const wells = await Well.find({ isActive: true }).limit(20);
    const events = await DrillingEvent.find({ verificationStatus: 'APPROVED' }).populate('wellId', 'wellName').populate('sourceDocumentId', 'title');
    
    const nodes = [];
    const edges = [];

    wells.forEach(w => nodes.push({ id: `well-${w._id}`, label: w.wellName, type: 'WELL', data: { field: w.field, status: w.status } }));
    
    events.forEach(e => {
      const nodeId = `event-${e._id}`;
      nodes.push({ id: nodeId, label: e.eventType.replace(/_/g, ' '), type: 'EVENT', data: { depth: e.depth, severity: e.severity } });
      if (e.wellId) edges.push({ source: `well-${e.wellId._id}`, target: nodeId, label: 'HAS_EVENT' });
      if (e.formation) {
        const formNodeId = `form-${e.formation.replace(/\s/g, '_')}`;
        if (!nodes.find(n => n.id === formNodeId)) nodes.push({ id: formNodeId, label: e.formation, type: 'FORMATION' });
        edges.push({ source: nodeId, target: formNodeId, label: 'IN_FORMATION' });
      }
      if (e.sourceDocumentId) {
        const docNodeId = `doc-${e.sourceDocumentId._id}`;
        if (!nodes.find(n => n.id === docNodeId)) nodes.push({ id: docNodeId, label: e.sourceDocumentId.title, type: 'DOCUMENT' });
        edges.push({ source: nodeId, target: docNodeId, label: 'SOURCED_FROM' });
      }
    });

    res.json({ success: true, data: { nodes, edges } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to build knowledge graph.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'eRTMAC-NWIS API', timestamp: new Date().toISOString() });
});

// Serve static React frontend client
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 eRTMAC-NWIS API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
