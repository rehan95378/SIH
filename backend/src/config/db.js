// This file holds the database settings in one reusable connection pool.
require('dotenv').config();

const { Pool } = require('pg');

const port = Number(process.env.DB_PORT || 5432);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535.');
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port,
  database: process.env.DB_NAME || 'crime_network',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Check that PostgreSQL is reachable. Errors are returned to the caller rather
// than hidden, so the API can report a real database problem.
const checkDatabaseConnection = async () => {
  const result = await pool.query('SELECT NOW() AS current_time');
  return result.rows[0];
};

// Close the pool when the application is shutting down.
const closeDatabase = () => pool.end();

module.exports = { pool, checkDatabaseConnection, closeDatabase };
