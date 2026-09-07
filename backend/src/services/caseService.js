// This service validates case data before database access.
const caseRepository = require('../repository/caseRepository');

const statuses = new Set(['open', 'closed', 'archived']);

const validateText = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string.`);
  }
};

const validateStatus = (status) => {
  if (!statuses.has(status)) {
    throw new Error('status must be open, closed, or archived.');
  }
};

const getCases = (filters) => caseRepository.listCases(filters);

const getCase = (id) => {
  validateText(id, 'Case id');
  return caseRepository.getCaseById(id);
};

const createCase = async ({ id, title, description, status = 'open', createdBy } = {}) => {
  validateText(id, 'id');
  validateText(title, 'title');
  validateStatus(status);

  if (description !== undefined && description !== null) {
    validateText(description, 'description');
  }

  return caseRepository.createCase({ id, title, description, status, createdBy });
};

const changeCaseStatus = async (id, status) => {
  validateText(id, 'Case id');
  validateStatus(status);
  return caseRepository.updateCaseStatus(id, status);
};

module.exports = {
  getCases,
  getCase,
  createCase,
  changeCaseStatus
};
