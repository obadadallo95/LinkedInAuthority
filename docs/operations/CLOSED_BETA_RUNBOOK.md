# LinkedIn Authority — Closed Beta Runbook

This checklist is for the operator who provisions the deployed beta. It does not publish to LinkedIn, rotate existing credentials, or modify production data automatically.

## 1. Provision the server boundary

Run the local, no-network preflight before provisioning or inviting anyone:

```sh
npm run closed-beta:preflight
```

The project pins Node 22 in `.nvmrc`, CI, and `package.json` engines. Use that
runtime for local preflight, migration, build, and deployment commands. In
Firebase App Hosting, select a Node runtime compatible with `>=22` in the
backend settings; App Hosting validates the selected runtime against the
`engines` field. See the [official App Hosting configuration guide](https://firebase.google.com/docs/app-hosting/frameworks-tooling#nodejs)
before the first rollout.

The beta configuration keeps `minInstances: 0` and caps `maxInstances: 3` to
avoid paying for idle capacity or allowing an accidental traffic loop to scale
without a bounded operational ceiling. Keep the server-side usage ledger and
route rate limits enabled as the primary AI-cost controls.

After the deployment environment is provisioned, run the strict variant in that environment. It validates secret presence and shape without printing values:

```sh
npm run closed-beta:preflight -- --strict
```

Set these values in the server environment, never in Vite/client variables:

- `GEMINI_API_KEY`
- `ANALYSIS_SIGNING_SECRET`
- `CRON_SECRET`
- `GITHUB_CREDENTIAL_ENCRYPTION_KEY` — a base64-encoded 32-byte key
- `PRODUCT_TELEMETRY_ENABLED=false` initially; enable only after beta consent and measurement review

Generate a new encryption key in the operator's secure environment, for example:

```sh
openssl rand -base64 32
```

Store it in the deployment secret manager. Do not commit it, print it in logs, or reuse a client/API key as this key.

## 1a. Provision an operator claim for beta reporting

The telemetry summary endpoint is not available to ordinary users. Prepare the
operator claim with the dry-run command first:

```sh
BETA_OPERATOR_UID=<firebase-auth-uid> \
BETA_OPERATOR_ROLE=admin \
npm run set-beta-operator-claim
```

Review the target Firebase project and UID. Apply the claim only explicitly:

```sh
BETA_OPERATOR_UID=<firebase-auth-uid> \
BETA_OPERATOR_ROLE=admin \
BETA_OPERATOR_COMMIT=true \
npm run set-beta-operator-claim
```

The command preserves existing custom claims, never prints them, and changes
Firebase Auth only when `BETA_OPERATOR_COMMIT=true`. Refresh the operator's ID
token before calling `GET /api/product-events/summary`.

## 2. Validate the deployed data path

Before migrating anything:

1. Confirm the deployment points to the intended Firebase project and Firestore database.
2. Confirm the Admin SDK can read the target project.
3. Deploy and verify `firestore.rules`.
4. Run the migration in dry-run mode and save only its redacted candidate list:

```sh
npm run migrate:github-credentials
```

The dry run must report candidates without token values. Stop if the project, count, or candidates are unexpected.

## 3. Reviewed credential migration

After the encryption key is provisioned and a rollback plan is recorded, run the explicit commit mode:

```sh
GITHUB_MIGRATION_COMMIT=true npm run migrate:github-credentials
```

Verify encrypted records before removing any legacy field. Only after that review, and with an approved backup/rollback plan, run:

```sh
GITHUB_MIGRATION_COMMIT=true \
GITHUB_MIGRATION_REMOVE_LEGACY=true \
npm run migrate:github-credentials
```

If any migration fails, do not delete legacy fields for that user. Investigate the redacted failure and retry only the reviewed scope.

## 4. Scheduler and retention

Configure the platform scheduler to call these authenticated server routes with the `CRON_SECRET` bearer token:

- `POST /api/cron/process-weekly` at the intended cadence.
- `POST /api/cron/retention` at least daily.

Confirm the scheduler timezone and the user/project timezone behavior. Automation creates reviewable drafts only; it never publishes to LinkedIn.

## 5. Pre-invite verification

After deployment, run the network smoke check against the exact deployed origin.
It only checks health, the SPA shell, service-worker cache boundaries, and
authentication guards; it does not call Gemini, GitHub, or LinkedIn:

```sh
DEPLOYED_BASE_URL=https://<deployed-origin> npm run test:deployed-smoke
```

Do not treat the local production smoke as a substitute for this deployed
check. Record the result with the deployment revision.

Run locally or against an isolated staging deployment:

```sh
npm run typecheck
npm test -- --run
npm run test:rules
npm run build
npm run test:production-smoke
npm run test:e2e
```

Manually verify with a non-production beta account:

- public repository selection works without a GitHub credential;
- private access is opt-in and the credential is not readable from the browser;
- disconnect removes the server credential;
- repository → evidence → angle → draft → edit → save → reload → copy works;
- editing a draft marks its prior claim audit stale;
- automation reports no activity, not meaningful, draft created, and failure states;
- the same activity window does not create a duplicate draft;
- export excludes private credentials;
- draft deletion removes its version history;
- account deletion removes the Firebase data tree and Auth identity.

## 6. Rollback and incident boundaries

- Disable the scheduler before investigating duplicate or runaway automation.
- Set `PRODUCT_TELEMETRY_ENABLED=false` to stop optional product-metric writes.
- Do not delete user credentials or data as a first response.
- Preserve sanitized run status and error information; never copy tokens, prompts, or generated content into logs.
- Re-run the local Rules Emulator and production smoke after a rules or server configuration change.

## Closed Beta gate

Invite users only after the operator has checked every item above and recorded the deployment revision, Firebase project/database, migration result, scheduler configuration, and rollback owner. A passing local build alone is not evidence that the deployed beta is ready.
