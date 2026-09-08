const { randomUUID } = require('crypto');
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
  id = randomUUID(),
  caseId,
  case_id,
  documentId,
  document_id,
  summary,
  status = 'unreviewed',
  createdBy
} = {}) => {
  const finalDocId = documentId || document_id;
  const finalCaseId = caseId || case_id;

  validateText(id, 'id');
  validateText(finalDocId, 'documentId');
  validateStatus(status);

  if (finalCaseId !== undefined && finalCaseId !== null && typeof finalCaseId !== 'string') {
    throw new Error('caseId must be a string.');
  }
  if (summary !== undefined && summary !== null && typeof summary !== 'string') {
    throw new Error('summary must be a string.');
  }

  const cleanCaseId = (typeof finalCaseId === 'string' && finalCaseId.trim() !== '')
    ? finalCaseId.trim()
    : null;
  const cleanSummary = (typeof summary === 'string' && summary.trim() !== '')
    ? summary.trim()
    : null;

  return reportRepository.createReport({
    id,
    caseId: cleanCaseId,
    documentId: finalDocId.trim(),
    summary: cleanSummary,
    status,
    createdBy
  });
};

module.exports = { getReports, getReport, createReport };
