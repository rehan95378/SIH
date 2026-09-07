// This repository contains the SQL used to store and fetch raw reports.
const { pool } = require('../config/db');

const listDocuments = async ({ createdBy, limit = 50, offset = 0 } = {}) => {
  const values = [];
  const conditions = [];

  if (createdBy) {
    values.push(createdBy);
    conditions.push(`created_by = $${values.length}`);
  }

  values.push(Number(limit), Number(offset));
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await pool.query(
    `SELECT id, title, content, created_by, created_at
       FROM documents
       ${whereClause}
      ORDER BY created_at DESC, id ASC
      LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

const getDocumentById = async (id) => {
  const result = await pool.query(
    `SELECT id, title, content, created_by, created_at
       FROM documents
      WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

// Save the original report text so every extracted item has an evidence source.
const createDocument = async ({ id, title, content, createdBy }) => {
  const result = await pool.query(
    `INSERT INTO documents (id, title, content, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, content, created_by, created_at`,
    [id, title, content, createdBy || null]
  );

  return result.rows[0];
};

module.exports = {
  listDocuments,
  getDocumentById,
  createDocument
};
