import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';

const port = Number(process.env.SMOKE_PORT || 4310);
const baseUrl = `http://127.0.0.1:${port}`;
const appHostingConfig = fs.readFileSync('apphosting.yaml', 'utf8');
assert.match(appHostingConfig, /variable:\s*GITHUB_CREDENTIAL_ENCRYPTION_KEY/);
assert.match(appHostingConfig, /secret:\s*github_credential_encryption_key/);
assert.match(appHostingConfig, /variable:\s*PRODUCT_TELEMETRY_ENABLED[\s\S]*value:\s*"false"/);
const child = spawn(process.execPath, ['dist/server.cjs'], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'production', PORT: String(port), CRON_SECRET: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.on('data', chunk => { output += chunk.toString(); });
child.stderr.on('data', chunk => { output += chunk.toString(); });

async function waitForHealth() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The production server may still be starting.
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Production server did not become healthy.\n${output}`);
}

async function expectStatus(path, expectedStatus) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, expectedStatus, `${path} returned ${response.status}`);
  return response;
}

async function expectOneOf(path, expectedStatuses) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.ok(expectedStatuses.includes(response.status), `${path} returned ${response.status}; expected one of ${expectedStatuses.join(', ')}`);
  return response;
}

function postChunked(path, body) {
  return new Promise((resolve, reject) => {
    const request = http.request(`http://127.0.0.1:${port}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }, response => {
      response.resume();
      response.once('end', () => resolve(response.statusCode));
    });
    request.once('error', reject);
    request.write(body);
    request.end();
  });
}

try {
  await waitForHealth();
  const health = await (await fetch(`${baseUrl}/api/health`)).json();
  assert.equal(health.status, 'ok');

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
  const oversizedDemoRequest = await fetch(`${baseUrl}/api/demo/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      repoUrl: 'https://github.com/example/fixture',
      projectDescription: 'x'.repeat(70 * 1024),
    }),
  });
  assert.equal(oversizedDemoRequest.status, 413, 'demo payload limit must reject oversized requests');
  const oversizedAuthenticatedAiRequest = await fetch(`${baseUrl}/api/analyze-repo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer not-a-real-token' },
    body: JSON.stringify({
      username: 'example',
      repo: 'fixture',
      projectDescription: 'x'.repeat(140 * 1024),
    }),
  });
  assert.equal(oversizedAuthenticatedAiRequest.status, 413, 'authenticated AI payload limit must reject oversized requests before auth verification');
  const oversizedChunkedRequest = await postChunked(
    '/api/demo/analyze',
    JSON.stringify({ repoUrl: 'https://github.com/example/fixture', projectDescription: 'x'.repeat(300 * 1024) }),
  );
  assert.equal(oversizedChunkedRequest, 413, 'chunked payload limit must remain a 413 instead of becoming a 500');
  console.log('Production smoke passed: health, SPA shell, service-worker cache policy, auth guard, cron guard, and App Hosting secret configuration.');
} finally {
  if (child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise(resolve => child.once('exit', resolve));
  }
}
