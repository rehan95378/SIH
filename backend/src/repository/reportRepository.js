// This repository stores report metadata and its links to cases and documents.
const { pool } = require('../config/db');

const selectFields = `
  id, case_id, document_id, summary, status, created_by, created_at
`;

const listReports = async ({
  caseId,
  documentId,
  status,
  limit = 50,
  offset = 0
} = {}) => {
  const values = [];
  const conditions = [];

  for (const [value, column] of [
    [caseId, 'case_id'],
    [documentId, 'document_id'],
    [status, 'status']
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
       FROM reports
       ${whereClause}
      ORDER BY created_at DESC, id ASC
      LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

const getReportById = async (id) => {
  const result = await pool.query(
    `SELECT ${selectFields}
       FROM reports
      WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const createReport = async ({
  id,
  caseId,
  documentId,
  summary,
  status = 'unreviewed',
  createdBy
}) => {
  const result = await pool.query(
    `INSERT INTO reports
       (id, case_id, document_id, summary, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${selectFields}`,
    [id, caseId || null, documentId, summary || null, status, createdBy || null]
  );

  return result.rows[0];
};

module.exports = {
  listReports,
  getReportById,
  createReport
};
