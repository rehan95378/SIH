// This service searches the main investigation records with one common query.
const { pool } = require('../config/db');

const allowedTypes = new Set(['entity', 'document', 'report', 'all']);

const searchRecords = async ({ query, type = 'all', limit = 50 } = {}) => {
  if (typeof query !== 'string' || query.trim() === '') {
    throw new Error('query must be a non-empty string.');
  }

  if (!allowedTypes.has(type)) {
    throw new Error('type must be entity, document, report, or all.');
  }

  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new Error('limit must be an integer between 1 and 100.');
  }

  const pattern = `%${query.trim()}%`;
  const values = [pattern, parsedLimit];
  const sources = [];

  if (type === 'all' || type === 'entity') {
    sources.push(`
      SELECT id, 'entity' AS result_type, name AS title,
             source_document_id AS related_document_id, created_at
        FROM entities
       WHERE name ILIKE $1 OR id ILIKE $1
    `);
  }

  if (type === 'all' || type === 'document') {
    sources.push(`
      SELECT id, 'document' AS result_type, title,
             id AS related_document_id, created_at
        FROM documents
       WHERE title ILIKE $1 OR content ILIKE $1 OR id ILIKE $1
    `);
  }

  if (type === 'all' || type === 'report') {
    sources.push(`
      SELECT id, 'report' AS result_type, COALESCE(summary, '') AS title,
             document_id AS related_document_id, created_at
        FROM reports
       WHERE summary ILIKE $1 OR id ILIKE $1
    `);
  }

  const result = await pool.query(
    `SELECT id, result_type, title, related_document_id, created_at
       FROM (${sources.join(' UNION ALL ')}) AS matches
      ORDER BY created_at DESC, id ASC
      LIMIT $2`,
    values
  );

  return result.rows;
};

module.exports = { searchRecords };
