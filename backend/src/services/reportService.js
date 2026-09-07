// This service validates report metadata before database access.
const reportRepository = require('../repository/reportRepository');

const statuses = new Set(['unreviewed', 'reviewed', 'flagged']);

const validateText = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string.`);
  }
};

const validateStatus = (status) => {
  if (!statuses.has(status)) {
    throw new Error('status must be unreviewed, reviewed, or flagged.');
  }
};

const getReports = (filters) => reportRepository.listReports(filters);

const getReport = (id) => {
  validateText(id, 'Report id');
  return reportRepository.getReportById(id);
};

const createReport = async ({
  id,
  caseId,
  documentId,
  summary,
  status = 'unreviewed',
  createdBy
} = {}) => {
  validateText(id, 'id');
  validateText(documentId, 'documentId');
  validateStatus(status);

  if (caseId !== undefined && caseId !== null) validateText(caseId, 'caseId');
  if (summary !== undefined && summary !== null) validateText(summary, 'summary');

  return reportRepository.createReport({
    id,
    caseId,
    documentId,
    summary,
    status,
    createdBy
  });
};

module.exports = { getReports, getReport, createReport };
