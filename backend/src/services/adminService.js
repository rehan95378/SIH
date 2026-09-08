// This service prepares the high-level counts shown to an administrator.
const { pool } = require('../config/db');
const userRepository = require('../repository/userRepository');

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

const getUsers = () => userRepository.listUsers();

const changeUserRole = async (id, role) => {
  if (!['admin', 'investigator', 'analyst'].includes(role)) {
    const error = new Error('role must be admin, investigator, or analyst.');
    error.statusCode = 400;
    throw error;
  }
  return userRepository.updateUserRole(id, role);
};

module.exports = { getOverview, getUsers, changeUserRole };
