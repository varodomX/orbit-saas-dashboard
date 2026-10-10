import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../lib/origin.mjs';
const request = (origin, host = 'localhost:3000', extra = {}) =>
  new Request('http://localhost:3000/api/session', {
    headers: { ...(origin ? { origin } : {}), host, ...extra },
  });
test('accepts browser host when Next normalizes the internal URL', () => {
  for (const host of ['localhost:3000', '127.0.0.1:3000', '192.168.1.118:3000', '[::1]:3000'])
    assert.ok(isAllowedOrigin(request(`http://${host}`, host)));
  assert.ok(isAllowedOrigin(request('https://orbit.example', 'orbit.example')));
});
test('rejects foreign origins, ports, missing and malformed origins', () => {
  for (const origin of ['https://evil.example', 'http://localhost:4000', 'null', undefined, 'http://localhost:3000/path', 'file://localhost:3000'])
    assert.equal(isAllowedOrigin(request(origin)), false);
  assert.equal(isAllowedOrigin(request('https://evil.example', 'localhost:3000', { 'x-forwarded-host': 'evil.example' })), false);
});
test('explicit public origin supports proxies and restricts accepted origins', () => {
  const configured = 'https://orbit.example';
  assert.ok(isAllowedOrigin(request(configured), configured));
  assert.equal(isAllowedOrigin(request('http://localhost:3000'), configured), false);
  assert.equal(isAllowedOrigin(request('https://evil.example'), configured), false);
});
