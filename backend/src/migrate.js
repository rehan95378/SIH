// This migration creates the first database structure for the backend.
const { pool, closeDatabase } = require('./config/db');

const migration = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    source_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    pagerank DOUBLE PRECISION,
    betweenness DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    source_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (source <> target)
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'unreviewed',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS entities_source_document_idx
    ON entities(source_document_id);

  CREATE INDEX IF NOT EXISTS relationships_source_idx
    ON relationships(source);

  CREATE INDEX IF NOT EXISTS relationships_target_idx
    ON relationships(target);

  CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
    ON audit_logs(created_at);
`;

// Run every statement in one transaction so a partial migration is not left
// behind if one table fails to be created.
const runMigration = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(migration);
    await client.query('COMMIT');
    console.log('Database migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runMigration()
    .catch((error) => {
      console.error('Database migration failed:', error.message);
      process.exitCode = 1;
    })
    .finally(() => closeDatabase());
}

module.exports = { runMigration, migration };
