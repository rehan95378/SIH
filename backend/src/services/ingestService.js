// This service owns the complete report-to-graph pipeline.
const { randomUUID } = require('crypto');
const { pool } = require('../config/db');
const { callAiModel } = require('../utils/aiClient');
const { calculatePageRank, calculateBetweenness, suspiciousPatterns } = require('./analyticsService');

const text = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string.`);
  }
};

const supportedDataTypes = new Set(['report', 'cdr', 'financial', 'social']);

const normaliseEntities = (documentId, entities = []) => entities.map((entity, index) => {
  text(entity.name, `entities[${index}].name`);
  text(entity.type, `entities[${index}].type`);
  const confidence = Number(entity.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`entities[${index}].confidence must be between 0 and 1.`);
  }

  return {
    id: entity.id || `${documentId}-entity-${index + 1}`,
    type: entity.type,
    name: entity.name,
    source_document_id: documentId,
    confidence
  };
});

const normaliseRelationships = (documentId, relationships = [], entities) => {
  const validIds = new Set(entities.map((entity) => entity.id));
  return relationships.map((edge, index) => {
    for (const field of ['source', 'target', 'relationship_type']) {
      text(edge[field], `relationships[${index}].${field}`);
    }

    if (!validIds.has(edge.source) || !validIds.has(edge.target)) {
      throw new Error(`relationships[${index}] references an unknown entity.`);
    }
    if (edge.source === edge.target) {
      throw new Error(`relationships[${index}] cannot connect an entity to itself.`);
    }

    return {
      id: edge.id || `${documentId}-relationship-${index + 1}`,
      source: edge.source,
      target: edge.target,
      relationship_type: edge.relationship_type,
      source_document_id: documentId
    };
  });
};

const persistPipeline = async (document, entities, relationships) => {
  const graph = { nodes: entities, edges: relationships };
  const pagerank = calculatePageRank(graph);
  const betweenness = calculateBetweenness(graph);
  const scoredEntities = entities.map((entity) => ({
    ...entity,
    pagerank: pagerank[entity.id] || 0,
    betweenness: betweenness[entity.id] || 0
  }));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO documents (id, title, content, created_by)
       VALUES ($1, $2, $3, $4)`,
      [document.id, document.title, document.content, document.created_by]
    );

    for (const entity of scoredEntities) {
      await client.query(
        `INSERT INTO entities
           (id, type, name, source_document_id, confidence, pagerank, betweenness)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entity.id,
          entity.type,
          entity.name,
          entity.source_document_id,
          entity.confidence,
          entity.pagerank,
          entity.betweenness
        ]
      );
    }

    for (const edge of relationships) {
      await client.query(
        `INSERT INTO relationships
           (id, source, target, relationship_type, source_document_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [edge.id, edge.source, edge.target, edge.relationship_type, edge.source_document_id]
      );
    }

    await client.query('COMMIT');
    return {
      document,
      graph: { nodes: scoredEntities, edges: relationships },
      analytics: {
        pagerank,
        betweenness,
        suspicious_patterns: suspiciousPatterns(graph, betweenness)
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const processReport = async ({
  id = randomUUID(),
  title,
  content,
  contentBase64,
  mimeType = 'text/plain',
  dataType = 'report',
  createdBy
} = {}) => {
  text(title, 'title');
  if (!supportedDataTypes.has(dataType)) {
    throw new Error('dataType must be report, cdr, financial, or social.');
  }
  if (
    (typeof content !== 'string' || content.trim() === '')
    && (typeof contentBase64 !== 'string' || contentBase64.trim() === '')
  ) {
    throw new Error('content or contentBase64 must be provided.');
  }
  const document = {
    id,
    title,
    content: typeof content === 'string' ? content : '',
    created_by: createdBy || null
  };

  const extraction = await callAiModel({
    documentId: document.id,
    content: document.content,
    contentBase64,
    mimeType,
    dataType
  });
  if (!extraction || !Array.isArray(extraction.entities) || !Array.isArray(extraction.relationships)) {
    throw new Error('AI service returned an invalid extraction response.');
  }
  if (typeof extraction.extracted_text === 'string' && extraction.extracted_text.trim()) {
    document.content = extraction.extracted_text;
  }
  if (typeof document.content !== 'string' || document.content.trim() === '') {
    throw new Error('AI service returned no extracted text for this document.');
  }
  const entities = normaliseEntities(document.id, extraction.entities);
  const relationships = normaliseRelationships(
    document.id,
    extraction.relationships,
    entities
  );

  const result = await persistPipeline(document, entities, relationships);
  return { ...result, extraction_status: extraction.status };
};

module.exports = {
  processReport,
  normaliseEntities,
  normaliseRelationships,
  persistPipeline
};
