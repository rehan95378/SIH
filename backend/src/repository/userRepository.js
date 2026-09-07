// This repository contains the SQL used to find and create application users.
const { pool } = require('../config/db');

const getUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, email, password_hash, role, created_at
       FROM users
      WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
};

const createUser = async ({ id, email, passwordHash, role = 'analyst' }) => {
  const result = await pool.query(
    `INSERT INTO users (id, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, role, created_at`,
    [id, email, passwordHash, role]
  );

  return result.rows[0];
};

module.exports = { getUserByEmail, createUser };
