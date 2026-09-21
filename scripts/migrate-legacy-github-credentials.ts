import 'dotenv/config';
import { runLegacyCredentialMigration } from '../server/services/legacyCredentialMigration';

const commit = process.env.GITHUB_MIGRATION_COMMIT === 'true';
const removeLegacy = process.env.GITHUB_MIGRATION_REMOVE_LEGACY === 'true';

const result = await runLegacyCredentialMigration({ commit, removeLegacy });
console.log(JSON.stringify({
  ...result,
  note: commit
    ? 'Encrypted storage was verified before any requested legacy-field removal.'
    : 'Dry-run only. No credentials were written or deleted.',
}, null, 2));

if (result.failures.length > 0) process.exitCode = 1;
