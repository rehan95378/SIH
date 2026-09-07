// This service prepares the high-level counts shown to an administrator.
const { pool } = require('../config/db');

const getOverview = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM documents) AS documents,
      (SELECT COUNT(*) FROM entities) AS entities,
      (SELECT COUNT(*) FROM relationships) AS relationships,
      (SELECT COUNT(*) FROM cases) AS cases,
      (SELECT COUNT(*) FROM reports) AS reports,
      (SELECT COUNT(*) FROM audit_logs) AS audit_logs
  `);

  const counts = result.rows[0];
  return Object.fromEntries(
    Object.entries(counts).map(([key, value]) => [key, Number(value)])
  );
};

module.exports = { getOverview };
