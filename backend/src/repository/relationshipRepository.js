// This repository contains the SQL used to read and save graph connections.
const { pool } = require('../config/db');

const parsePageValue = (value, fallback, name) => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return parsed;
};

const selectFields = `
  id, source, target, relationship_type, source_document_id, created_at
`;

// List edges with optional source, target, type, or document filters.
const listRelationships = async ({
  source,
  target,
  relationshipType,
  sourceDocumentId,
  limit = 100,
  offset = 0
} = {}) => {
  const pageSize = parsePageValue(limit, 100, 'limit');
  const pageOffset = parsePageValue(offset, 0, 'offset');
  const conditions = [];
  const values = [];

  for (const [value, column] of [
    [source, 'source'],
    [target, 'target'],
    [relationshipType, 'relationship_type'],
    [sourceDocumentId, 'source_document_id']
  ]) {
    if (value) {
      values.push(value);
      conditions.push(`${column} = $${values.length}`);
    }
  }

  values.push(pageSize, pageOffset);
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await pool.query(
    `SELECT ${selectFields}
       FROM relationships
       ${whereClause}
      ORDER BY created_at DESC, id ASC
      LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

// Fetch one edge by its contract id.
const getRelationshipById = async (id) => {
  const result = await pool.query(
    `SELECT ${selectFields}
       FROM relationships
      WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

// Save an edge. Foreign keys ensure both endpoint entities exist.
const createRelationship = async ({
  id,
  source,
  target,
  relationship_type: relationshipType,
  source_document_id: sourceDocumentId
}) => {
  const result = await pool.query(
    `INSERT INTO relationships
       (id, source, target, relationship_type, source_document_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${selectFields}`,
    [id, source, target, relationshipType, sourceDocumentId]
  );

  return result.rows[0];
};

const listRelationshipsForEntity = async (entityId, { limit = 100, offset = 0 } = {}) => {
  const pageSize = parsePageValue(limit, 100, 'limit');
  const pageOffset = parsePageValue(offset, 0, 'offset');

  const result = await pool.query(
    `SELECT ${selectFields}
       FROM relationships
      WHERE source = $1 OR target = $1
      ORDER BY created_at DESC, id ASC
      LIMIT $2
     OFFSET $3`,
    [entityId, pageSize, pageOffset]
  );

  return result.rows;
};

module.exports = {
  listRelationships,
  listRelationshipsForEntity,
  getRelationshipById,
  createRelationship
};
