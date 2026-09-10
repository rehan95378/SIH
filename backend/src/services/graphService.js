// This service combines stored nodes and connections into one graph response.
const entityRepository = require('../repository/entityRepository');
const relationshipRepository = require('../repository/relationshipRepository');
const documentRepository = require('../repository/documentRepository');

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

  return { nodes, links: edges, edges };
};

const getRelationshipsForEntity = async (entityId, options = {}) => {
  validateId(entityId, 'Entity id');

  return relationshipRepository.listRelationshipsForEntity(entityId, options);
};

const getNodeDetail = async (entityId) => {
  validateId(entityId, 'Entity id');
  const node = await entityRepository.getEntityById(entityId);
  if (!node) return null;
  const links = await relationshipRepository.listRelationshipsForEntity(entityId);
  const documentIds = new Set([node.source_document_id]);
  links.forEach((link) => documentIds.add(link.source_document_id));
  const evidence = await Promise.all(
    [...documentIds].map((documentId) => documentRepository.getDocumentById(documentId))
  );
  return { node, links, evidence: evidence.filter(Boolean) };
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
  getNodeDetail,
  createRelationship
};
