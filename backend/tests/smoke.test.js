const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('health route is available', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const response = await fetch(`http://localhost:${port}/health`);
  const data = await response.json();

  assert.ok([200, 503].includes(response.status));
  assert.ok(['ok', 'degraded'].includes(data.status));
  assert.ok(['ok', 'unavailable'].includes(data.database));

  await new Promise((resolve) => server.close(resolve));
});
