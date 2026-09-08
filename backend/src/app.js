// This is the main Express app. It wires routes, middleware, and error handling.
const express = require('express');
const cors = require('cors');
const { checkDatabaseConnection } = require('./config/db');
const { authMiddleware } = require('./middleware/auth');
const { auditLogger } = require('./middleware/auditLogger');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const ingestRoutes = require('./routes/ingestRoutes');
const entityRoutes = require('./routes/entityRoutes');
const graphRoutes = require('./routes/graphRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const documentRoutes = require('./routes/documentRoutes');
const caseRoutes = require('./routes/caseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

app.use(cors());
// Reports and CSV evidence can legitimately span many lines. Keep this
// aligned with the multipart upload limit while avoiding Express' tiny default.
app.use(express.json({ limit: '10mb' }));
app.use(auditLogger);

app.get('/health', async (req, res, next) => {
  try {
    const database = await checkDatabaseConnection();
    return res.json({
      status: 'ok',
      database: 'ok',
      database_time: database.current_time
    });
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      database: 'unavailable',
      message: 'Database connection is unavailable.'
    });
  }
});

app.use('/api', authRoutes);

// Everything below login requires a valid signed user token.
app.use('/api', authMiddleware);
app.use('/api', ingestRoutes);
app.use('/api', entityRoutes);
app.use('/api', graphRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', searchRoutes);
app.use('/api', documentRoutes);
app.use('/api', caseRoutes);
app.use('/api', reportRoutes);
app.use('/api', adminRoutes);
app.use('/api', auditRoutes);

// Return a consistent JSON response when no route matches.
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.', status: 404 });
});

app.use(errorHandler);

module.exports = app;
