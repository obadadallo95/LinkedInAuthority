import assert from 'node:assert/strict';

const rawBaseUrl = process.env.DEPLOYED_BASE_URL?.trim();
if (!rawBaseUrl) {
  throw new Error('DEPLOYED_BASE_URL is required; no network request was made.');
}

const baseUrl = new URL(rawBaseUrl);
if (!['https:', 'http:'].includes(baseUrl.protocol)) {
  throw new Error('DEPLOYED_BASE_URL must use https:// (or http:// for local staging).');
}
if (baseUrl.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname)) {
  throw new Error('http:// is allowed only for local staging; use https:// for deployed environments.');
}
baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, '');
baseUrl.search = '';
baseUrl.hash = '';

async function request(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(new URL(path, baseUrl), { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function expectStatus(path, expectedStatus, init) {
  const response = await request(path, init);
  assert.equal(response.status, expectedStatus, `${path} returned an unexpected status`);
  return response;
}

async function expectOneOf(path, expectedStatuses, init) {
  const response = await request(path, init);
  assert.ok(expectedStatuses.includes(response.status), `${path} returned an unexpected status`);
  return response;
}

const health = await expectStatus('/api/health', 200);
assert.equal((await health.json()).status, 'ok');

const index = await expectStatus('/', 200);
assert.match(await index.text(), /LinkedIn Authority|<!doctype html/i);

const serviceWorker = await expectStatus('/sw.js', 200);
const serviceWorkerText = await serviceWorker.text();
assert.match(serviceWorkerText, /linkedin-authority-shell-v2/);
assert.match(serviceWorkerText, /self\.clients\.claim/);
assert.ok(serviceWorkerText.includes("url.pathname.startsWith('/api/')"));
assert.doesNotMatch(serviceWorkerText, /registration\.unregister/);

await expectStatus('/api/account/export', 401);
await expectOneOf('/api/cron/process-weekly', [401, 503]);

console.log('Deployed smoke passed: health, SPA shell, service-worker policy, auth guard, and cron guard.');
