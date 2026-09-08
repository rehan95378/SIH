// This service combines stored nodes and connections into one graph response.
const entityRepository = require('../repository/entityRepository');
const relationshipRepository = require('../repository/relationshipRepository');

const validateId = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
};

// Read both halves of the graph at the same time, then return the agreed shape.
const buildGraph = async (filters = {}) => {
  const [nodes, edges] = await Promise.all([
    entityRepository.listEntities({
      sourceDocumentId: filters.sourceDocumentId,
      limit: filters.nodeLimit,
      offset: filters.nodeOffset
    }),
    relationshipRepository.listRelationships({
      sourceDocumentId: filters.sourceDocumentId,
      limit: filters.edgeLimit,
      offset: filters.edgeOffset
    })
  ]);

  return { nodes, edges };
};

const getRelationshipsForEntity = async (entityId, options = {}) => {
  validateId(entityId, 'Entity id');

  return relationshipRepository.listRelationshipsForEntity(entityId, options);
};

const createRelationship = async (relationship) => {
  const requiredFields = [
    'id',
    'source',
    'target',
    'relationship_type',
    'source_document_id'
  ];

  for (const field of requiredFields) {
    if (typeof relationship[field] !== 'string' || relationship[field].trim() === '') {
      throw new Error(`${field} must be a non-empty string.`);
    }
  }

  if (relationship.source === relationship.target) {
    throw new Error('A relationship cannot connect an entity to itself.');
  }

  return relationshipRepository.createRelationship(relationship);
};

module.exports = {
  buildGraph,
  getRelationshipsForEntity,
  createRelationship
};
