// Report controller translates report HTTP requests into service calls.
const { asyncHandler } = require('../utils/asyncHandler');
const reportService = require('../services/reportService');

const listReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getReports({
    caseId: req.query.case_id,
    documentId: req.query.document_id,
    status: req.query.status,
    limit: req.query.limit,
    offset: req.query.offset
  });

  return res.json({ reports });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });
  return res.json({ report });
});

const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport({
    id: req.body.id,
    caseId: req.body.case_id || req.body.caseId,
    documentId: req.body.document_id || req.body.documentId,
    summary: req.body.summary,
    status: req.body.status,
    createdBy: req.user.id
  });
  return res.status(201).json({ report });
});

module.exports = { listReports, getReport, createReport };
