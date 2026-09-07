// This service applies entity rules before using the database repository.
const entityRepository = require('../repository/entityRepository');

const requiredTextFields = ['id', 'type', 'name', 'source_document_id'];

const validateEntity = (entity) => {
  for (const field of requiredTextFields) {
    if (typeof entity[field] !== 'string' || entity[field].trim() === '') {
      throw new Error(`${field} must be a non-empty string.`);
    }
  }

  if (
    typeof entity.confidence !== 'number'
    || !Number.isFinite(entity.confidence)
    || entity.confidence < 0
    || entity.confidence > 1
  ) {
    throw new Error('confidence must be a number between 0 and 1.');
  }
};

// Read entities while keeping database-specific details out of controllers.
const getEntities = (filters) => entityRepository.listEntities(filters);

const getEntity = (id) => {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('Entity id must be a non-empty string.');
  }

  return entityRepository.getEntityById(id);
};

const createEntity = async (entity) => {
  validateEntity(entity);
  return entityRepository.createEntity(entity);
};

const setEntityScores = async (id, scores) => {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('Entity id must be a non-empty string.');
  }

  const { pagerank, betweenness } = scores;
  for (const [name, value] of Object.entries({ pagerank, betweenness })) {
    if (
      typeof value !== 'number'
      || !Number.isFinite(value)
      || value < 0
    ) {
      throw new Error(`${name} must be a non-negative number.`);
    }
  }

  return entityRepository.updateEntityScores(id, scores);
};

module.exports = {
  getEntities,
  getEntity,
  createEntity,
  setEntityScores,
  validateEntity
};
