const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword, createAuthToken, verifyAuthToken } = require('../src/utils/crypto');
const { calculatePageRank, calculateBetweenness, suspiciousPatterns } = require('../src/services/analyticsService');
const { localExtract } = require('../src/utils/aiClient');

test('crypto: password hashing and verification', async () => {
  const password = 'SuperSecret123!';
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.ok(hash.includes(':'));

  const valid = await verifyPassword(password, hash);
  assert.equal(valid, true);

  const invalid = await verifyPassword('WrongPassword', hash);
  assert.equal(invalid, false);
});

test('crypto: auth token generation and verification', () => {
  const user = { id: 'user-123', email: 'test@example.com', role: 'investigator' };
  const token = createAuthToken(user, 3600);
  assert.ok(typeof token === 'string');
  assert.ok(token.includes('.'));

  const verified = verifyAuthToken(token);
  assert.equal(verified.id, user.id);
  assert.equal(verified.email, user.email);
  assert.equal(verified.role, user.role);

  const invalid = verifyAuthToken('invalid.token');
  assert.equal(invalid, null);
});

test('analytics: PageRank and Betweenness scoring', () => {
  const graph = {
    nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
    edges: [
      { id: 'e1', source: 'A', target: 'B', source_document_id: 'doc-1' },
      { id: 'e2', source: 'B', target: 'C', source_document_id: 'doc-1' }
    ]
  };

  const pagerank = calculatePageRank(graph);
  assert.ok(pagerank.A > 0);
  assert.ok(pagerank.B > 0);
  assert.ok(pagerank.C > 0);

  const betweenness = calculateBetweenness(graph);
  assert.ok(betweenness.B > 0);
  assert.equal(betweenness.A, 0);
  assert.equal(betweenness.C, 0);

  const patterns = suspiciousPatterns(graph, betweenness);
  assert.ok(Array.isArray(patterns.bridge_nodes));
  assert.ok(patterns.bridge_nodes.includes('B'));
});

test('aiClient: localExtract does not confuse dates with phone numbers', () => {
  const text = 'Incident occurred on 2026-09-08 near warehouse. Call +91 98765 43210 for info.';
  const result = localExtract('doc-test', text);
  const phones = result.entities.filter((e) => e.type === 'phone');
  assert.equal(phones.length, 1);
  assert.equal(phones[0].name, '+91 98765 43210');
});
