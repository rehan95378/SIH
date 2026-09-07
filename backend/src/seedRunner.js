// This script inserts safe demo records for local development.
const { pool, closeDatabase } = require('./config/db');
const { hashPassword } = require('./utils/crypto');

const seed = async () => {
  const passwordHash = await hashPassword('demo-password');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO users (id, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      ['demo-admin', 'admin@example.com', passwordHash, 'admin']
    );

    await client.query(
      `INSERT INTO documents (id, title, content, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [
        'demo-document',
        'Demo investigation report',
        'Amit met Ravi near the warehouse and contacted Blue River Logistics.',
        'demo-admin'
      ]
    );

    await client.query(
      `INSERT INTO entities
         (id, type, name, source_document_id, confidence)
       VALUES
         ('demo-person-amit', 'person', 'Amit', 'demo-document', 0.98),
         ('demo-person-ravi', 'person', 'Ravi', 'demo-document', 0.96),
         ('demo-org-blue-river', 'organization', 'Blue River Logistics', 'demo-document', 0.91)
       ON CONFLICT (id) DO NOTHING`
    );

    await client.query(
      `INSERT INTO relationships
         (id, source, target, relationship_type, source_document_id)
       VALUES
         ('demo-edge-amit-ravi', 'demo-person-amit', 'demo-person-ravi', 'met', 'demo-document'),
         ('demo-edge-ravi-org', 'demo-person-ravi', 'demo-org-blue-river', 'contacted', 'demo-document')
       ON CONFLICT (id) DO NOTHING`
    );

    await client.query(
      `INSERT INTO cases (id, title, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        'demo-case',
        'Demo network investigation',
        'Seeded case for testing the dashboard and graph API.',
        'open',
        'demo-admin'
      ]
    );

    await client.query('COMMIT');
    console.log('Demo seed data inserted.');
    console.log('Demo login: admin@example.com / demo-password');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error('Database seed failed:', error.message);
      process.exitCode = 1;
    })
    .finally(() => closeDatabase());
}

module.exports = { seed };
