// Routes for report metadata and retrieval.
const express = require('express');
const {
  listReports,
  getReport,
  createReport
} = require('../controllers/reportController');
const { reportBody } = require('../validators/schemas');
const router = express.Router();

router.get('/reports', listReports);
router.get('/reports/:id', getReport);
router.post('/reports', reportBody, createReport);

module.exports = router;
