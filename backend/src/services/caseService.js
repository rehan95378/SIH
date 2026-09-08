const { randomUUID } = require('crypto');
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

const createCase = async ({ id = randomUUID(), title, description, status = 'open', createdBy } = {}) => {
  validateText(id, 'id');
  validateText(title, 'title');
  validateStatus(status);

  if (description !== undefined && description !== null && typeof description !== 'string') {
    throw new Error('description must be a string.');
  }

  const cleanDescription = (typeof description === 'string' && description.trim() !== '')
    ? description.trim()
    : null;

  return caseRepository.createCase({
    id,
    title: title.trim(),
    description: cleanDescription,
    status,
    createdBy
  });
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
