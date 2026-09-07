// This service validates audit events before storing or reading them.
const auditRepository = require('../repository/auditRepository');

const recordAuditEvent = (event) => {
  if (!event || typeof event.action !== 'string' || event.action.trim() === '') {
    throw new Error('Audit action must be a non-empty string.');
  }

  return auditRepository.createAuditEntry(event);
};

const getAuditRecords = (filters) => auditRepository.listAuditEntries(filters);

module.exports = { recordAuditEvent, getAuditRecords };
