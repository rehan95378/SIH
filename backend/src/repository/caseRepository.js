// This repository stores and reads investigation cases.
const { pool } = require('../config/db');

const selectFields = 'id, title, description, status, created_by, created_at';

const listCases = async ({ status, createdBy, limit = 50, offset = 0 } = {}) => {
  const values = [];
  const conditions = [];

  for (const [value, column] of [
    [status, 'status'],
    [createdBy, 'created_by']
  ]) {
    if (value) {
      values.push(value);
      conditions.push(`${column} = $${values.length}`);
    }
  }

  values.push(Number(limit), Number(offset));
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await pool.query(
    `SELECT ${selectFields}
       FROM cases
       ${whereClause}
      ORDER BY created_at DESC, id ASC
      LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

const getCaseById = async (id) => {
  const result = await pool.query(
    `SELECT ${selectFields}
       FROM cases
      WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const createCase = async ({ id, title, description, status = 'open', createdBy }) => {
  const result = await pool.query(
    `INSERT INTO cases (id, title, description, status, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${selectFields}`,
    [id, title, description || null, status, createdBy || null]
  );

  return result.rows[0];
};

const updateCaseStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE cases
        SET status = $2
      WHERE id = $1
      RETURNING ${selectFields}`,
    [id, status]
  );

  return result.rows[0] || null;
};

module.exports = {
  listCases,
  getCaseById,
  createCase,
  updateCaseStatus
};
