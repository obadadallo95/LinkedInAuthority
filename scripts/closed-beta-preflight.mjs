import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict') || process.env.CLOSED_BETA_PREFLIGHT_STRICT === 'true';
const failures = [];
const manual = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireText(relativePath, pattern, description) {
  try {
    const text = read(relativePath);
    if (!pattern.test(text)) failures.push(`${relativePath}: ${description}`);
  } catch {
    failures.push(`${relativePath}: file is missing or unreadable`);
  }
}

function requireRuntimeOnlyEnv(variable) {
  try {
    const text = read('apphosting.yaml');
    const block = text.match(new RegExp(`\\n\\s+- variable:\\s+${variable}\\b([\\s\\S]*?)(?=\\n\\s+- variable:|$)`));
    if (!block || !/availability:\s*\n\s*-\s*RUNTIME\b/.test(block[1]) || /-\s*BUILD\b/.test(block[1])) {
      failures.push(`apphosting.yaml: ${variable} must be runtime-only`);
    }
  } catch {
    failures.push(`apphosting.yaml: ${variable} runtime availability could not be checked`);
  }
}

function hasValue(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function assertSecretShape(name, validator, description) {
  if (!hasValue(name)) {
    manual.push(`${name} is not present in this shell`);
    if (strict) failures.push(`${name}: ${description}`);
    return;
  }
  if (!validator(process.env[name])) failures.push(`${name}: ${description}`);
}

// Static checks are safe to run on every workstation and do not require a
// Firebase/GitHub/Gemini connection.
for (const file of [
  'apphosting.yaml',
  'firestore.rules',
  'server/routes/account.ts',
  'server/routes/automation.ts',
  'server/routes/cron.ts',
  'server/routes/integrations.ts',
  'server/services/githubCredentials.ts',
  'scripts/migrate-legacy-github-credentials.ts',
  'scripts/set-beta-operator-claim.ts',
  'scripts/deployed-smoke.mjs',
]) {
  try {
    fs.accessSync(path.join(root, file), fs.constants.R_OK);
  } catch {
    failures.push(`${file}: required Closed Beta artifact is missing`);
  }
}

requireText('apphosting.yaml', /variable:\s+GITHUB_CREDENTIAL_ENCRYPTION_KEY[\s\S]*secret:\s+github_credential_encryption_key/, 'encrypted GitHub credential secret is not configured');
requireText('apphosting.yaml', /variable:\s+ANALYSIS_SIGNING_SECRET[\s\S]*secret:\s+analysis_signing_secret/, 'analysis signing secret is not configured');
requireText('apphosting.yaml', /variable:\s+CRON_SECRET[\s\S]*secret:\s+cron_secret/, 'cron secret is not configured');
requireText('apphosting.yaml', /variable:\s+PRODUCT_TELEMETRY_ENABLED[\s\S]*value:\s*["']false["']/, 'telemetry must default to disabled');
requireText('apphosting.yaml', /runConfig:[\s\S]*maxInstances:\s*3/, 'Closed Beta must cap App Hosting instances to control runaway cost');
requireText('apphosting.yaml', /runConfig:[\s\S]*minInstances:\s*0/, 'Closed Beta must keep idle instances at zero');
requireText('package.json', /"engines"\s*:\s*\{[\s\S]*"node"\s*:\s*">=22"/, 'production runtime must declare Node 22 or newer');
requireText('.nvmrc', /^\s*22\s*$/m, 'local/CI runtime should pin Node 22');
requireText('firestore.rules', /githubToken|linkedinToken|githubCredentials|telemetry|usageLedger/, 'rules must explicitly cover sensitive/server-managed paths');
requireText('server/routes/integrations.ts', /fetchWithTimeout/, 'GitHub integration requests must have a timeout');
requireText('server/routes/integrations.ts', /githubInFlight|cachedGithubValue/, 'GitHub integration must coalesce/cache upstream reads');
for (const variable of [
  'GEMINI_API_KEY',
  'GEMINI_PRO_API_KEY',
  'ANALYSIS_SIGNING_SECRET',
  'CRON_SECRET',
  'GITHUB_CREDENTIAL_ENCRYPTION_KEY',
  'PRODUCT_TELEMETRY_ENABLED',
]) requireRuntimeOnlyEnv(variable);

const sourceFiles = ['src', 'public']
  .flatMap((directory) => {
    const absolute = path.join(root, directory);
    if (!fs.existsSync(absolute)) return [];
    const result = [];
    const visit = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) visit(full);
        else if (/\.(ts|tsx|js|jsx|json|md|html)$/.test(entry.name)) result.push(full);
      }
    };
    visit(absolute);
    return result;
  });
const forbiddenClientSecretPattern = /VITE_(?:GEMINI_API_KEY|CRON_SECRET|ANALYSIS_SIGNING_SECRET|GITHUB_CREDENTIAL_ENCRYPTION_KEY)|import\.meta\.env\.(?:GEMINI_API_KEY|CRON_SECRET|ANALYSIS_SIGNING_SECRET|GITHUB_CREDENTIAL_ENCRYPTION_KEY)/;
for (const file of sourceFiles) {
  if (forbiddenClientSecretPattern.test(fs.readFileSync(file, 'utf8'))) {
    failures.push(`${path.relative(root, file)}: server secret appears to be client-exposed`);
  }
}

assertSecretShape('GITHUB_CREDENTIAL_ENCRYPTION_KEY', (value) => {
  try { return Buffer.from(value, 'base64').length === 32; } catch { return false; }
}, 'must decode from base64 to exactly 32 bytes');
assertSecretShape('ANALYSIS_SIGNING_SECRET', (value) => value.length >= 32, 'must be at least 32 characters');
assertSecretShape('CRON_SECRET', (value) => value.length >= 16, 'must be at least 16 characters');
assertSecretShape('GEMINI_API_KEY', (value) => !/^MY_|replace_with_|CHANGE_ME/i.test(value), 'must be provisioned and must not be a placeholder');
if (hasValue('PRODUCT_TELEMETRY_ENABLED') && process.env.PRODUCT_TELEMETRY_ENABLED !== 'false') {
  failures.push('PRODUCT_TELEMETRY_ENABLED: must remain false until beta consent/measurement review');
}

if (failures.length > 0) {
  console.error('Closed Beta preflight failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Closed Beta preflight passed static checks${strict ? ' and strict environment checks' : ''}.`);
  if (manual.length > 0) {
    console.log('Manual production provisioning still required (names only; values were not inspected or printed):');
    for (const item of manual) console.log(`- ${item}`);
  }
}
