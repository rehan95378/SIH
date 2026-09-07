// This repository contains the SQL used to read and save graph nodes.
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

// List entities with optional filters for the type, document, or name.
const listEntities = async ({
  type,
  sourceDocumentId,
  search,
  limit = 50,
  offset = 0
} = {}) => {
  const pageSize = parsePageValue(limit, 50, 'limit');
  const pageOffset = parsePageValue(offset, 0, 'offset');
  const conditions = [];
  const values = [];

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  if (sourceDocumentId) {
    values.push(sourceDocumentId);
    conditions.push(`source_document_id = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  values.push(pageSize, pageOffset);
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await pool.query(
    `SELECT id, type, name, source_document_id, confidence, pagerank,
            betweenness, created_at
       FROM entities
       ${whereClause}
      ORDER BY created_at DESC, id ASC
      LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

// Fetch one entity by its contract id.
const getEntityById = async (id) => {
  const result = await pool.query(
    `SELECT id, type, name, source_document_id, confidence, pagerank,
            betweenness, created_at
       FROM entities
      WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

// Save a new entity. The database constraint also checks the confidence range.
const createEntity = async ({
  id,
  type,
  name,
  source_document_id: sourceDocumentId,
  confidence
}) => {
  const result = await pool.query(
    `INSERT INTO entities
       (id, type, name, source_document_id, confidence)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, name, source_document_id, confidence, pagerank,
               betweenness, created_at`,
    [id, type, name, sourceDocumentId, confidence]
  );

  return result.rows[0];
};

// Add graph-analysis scores after PageRank and betweenness are calculated.
const updateEntityScores = async (id, { pagerank, betweenness }) => {
  const result = await pool.query(
    `UPDATE entities
        SET pagerank = $2, betweenness = $3
      WHERE id = $1
      RETURNING id, type, name, source_document_id, confidence, pagerank,
                betweenness, created_at`,
    [id, pagerank, betweenness]
  );

  return result.rows[0] || null;
};

module.exports = {
  listEntities,
  getEntityById,
  createEntity,
  updateEntityScores
};
