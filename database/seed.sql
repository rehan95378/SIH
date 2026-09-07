-- Demo data for local backend testing.
-- Demo login: admin@example.com / demo-password

BEGIN;

INSERT INTO users (id, email, password_hash, role)
VALUES (
  'demo-admin',
  'admin@example.com',
  '64656d6f2d73616c742d3132333435:a1c638d3a068184dbb7e2c54583844057730bb715d476ef96efdb58b68464475f4aa1049bb388ec6784c542c8ea0a56f07c747a1c7aa10c9a5fe11b65077dd18',
  'admin'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents (id, title, content, created_by)
VALUES (
  'demo-document',
  'Demo investigation report',
  'Amit met Ravi near the warehouse and contacted Blue River Logistics.',
  'demo-admin'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO entities
  (id, type, name, source_document_id, confidence)
VALUES
  ('demo-person-amit', 'person', 'Amit', 'demo-document', 0.98),
  ('demo-person-ravi', 'person', 'Ravi', 'demo-document', 0.96),
  ('demo-org-blue-river', 'organization', 'Blue River Logistics', 'demo-document', 0.91)
ON CONFLICT (id) DO NOTHING;

INSERT INTO relationships
  (id, source, target, relationship_type, source_document_id)
VALUES
  ('demo-edge-amit-ravi', 'demo-person-amit', 'demo-person-ravi', 'met', 'demo-document'),
  ('demo-edge-ravi-org', 'demo-person-ravi', 'demo-org-blue-river', 'contacted', 'demo-document')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cases (id, title, description, status, created_by)
VALUES (
  'demo-case',
  'Demo network investigation',
  'Seeded case for testing the dashboard and graph API.',
  'open',
  'demo-admin'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;