// This repository stores and reads the audit trail from PostgreSQL.
const { pool } = require('../config/db');

const createAuditEntry = async ({
  userId,
  action,
  resourceType,
  resourceId,
  metadata = {}
}) => {
  const result = await pool.query(
    `INSERT INTO audit_logs
       (user_id, action, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, action, resource_type, resource_id, metadata, created_at`,
    [userId || null, action, resourceType || null, resourceId || null, metadata]
  );

  return result.rows[0];
};

const listAuditEntries = async ({ userId, limit = 100, offset = 0 } = {}) => {
  const values = [];
  const conditions = [];

  if (userId) {
    values.push(userId);
    conditions.push(`user_id = $${values.length}`);
  }

  values.push(Number(limit), Number(offset));
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await pool.query(
    `SELECT id, user_id, action, resource_type, resource_id, metadata, created_at
       FROM audit_logs
       ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

module.exports = { createAuditEntry, listAuditEntries };
