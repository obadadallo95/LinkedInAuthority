# API Reference

This is the current Express route surface. The application is an active beta; this document describes implemented routes only.

## Authentication

`GET /api/health` and the demo routes are unauthenticated. The remaining `/api` routes require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

New GitHub credentials are sent once to an authenticated server integration endpoint and stored encrypted in an Admin-only record; AI endpoints resolve them server-side and do not accept client tokens. Private-repository access is opt-in: unless the server-side `githubPermissions` setting is exactly `all`, stored credentials and ambient GitHub tokens are not used, so requests remain public-only. Existing legacy records require migration. Gemini secrets are loaded only by the server. LinkedIn OAuth and publishing endpoints are not implemented.

## Implemented routes

### `GET /api/health`

Returns a basic server health response.

The production bundle is verified with `npm audit` before release; Firestore is an explicit server dependency because Firebase Admin's Firestore adapter is optional in its package metadata but required by this application.

### `POST /api/demo/analyze`

Analyzes the configured demo repository with anonymous, IP-keyed limits.

### `POST /api/demo/generate`

Generates demo content from a signed demo analysis session.

### `POST /api/analyze-repo`

Fetches GitHub repository context and returns grounded candidate angles plus an expiring analysis token.

Required body fields:

```json
{
  "username": "owner",
  "repo": "repository"
}
```

Optional fields include `projectDescription`, `lang`, and `intent`. GitHub credentials are never accepted in this request body; private access is resolved server-side from the encrypted integration record.

### `POST /api/generate-post`

Generates a post from a valid analysis token. The token is checked for user, repository, audience, language, signature, and expiry before generation.

### `POST /api/analyze-commits`

Creates a structured technical update from recent commit summaries. It uses a
separate `commit.analyze` capability budget so commit analysis cannot consume
or bypass the draft-refinement budget.

### `POST /api/generate-hashtags`

Returns generated hashtags for supplied post text.

### `POST /api/optimize-post`

Applies a bounded, evidence-preserving refinement to an existing draft. The request accepts `text`, an allowlisted `actionType`, and optional `customPrompt`/`lang`; it never fetches GitHub or publishes to LinkedIn. The route uses the low-cost Flash-Lite model and the `post.optimize` capability ledger.

### `POST /api/deep-scan`

Fetches repository identity and recent activity, synthesizes grounded context, and returns an editable draft plus a suggested call to action.

### `POST /api/cron/process-weekly`

Processes due repository-monitoring configurations and stores generated drafts. It requires a configured `CRON_SECRET`; there is no development fallback secret.

### `GET /api/automation/runs`

Returns bounded, authenticated run history for the user's monitored projects.

### `POST /api/automation/projects`

Creates or enables a monitored project after server-side validation and the account's atomic `automation.max_projects` entitlement check. Monitoring must not be enabled by a direct client Firestore write.

### `PATCH /api/automation/projects/:projectId`

Pauses or resumes an existing project. Resuming applies the same server-side atomic project-limit check; pausing is always allowed for the owner.

### `DELETE /api/automation/projects/:projectId`

Recursively deletes an authenticated user's monitored project and its automation run history. It does not delete drafts belonging to the project; drafts remain user-owned content and can be deleted separately.

### `POST /api/cron/retention`

Removes expired operational records only (rate-limit state, usage ledger entries, automation run history, and old repository snapshot versions). It never removes drafts, projects, current snapshot pointers, or private credentials. It requires the same configured `CRON_SECRET`.

### `GET /api/account/export`

Exports the authenticated user's owned Firestore collections recursively, including nested draft versions and automation history, while excluding `privateCredentials` at every level.

### `DELETE /api/account`

Performs an Admin recursive delete of the authenticated user's Firestore tree and then deletes the Firebase Auth identity.

### `DELETE /api/account/drafts/:draftId`

Recursively deletes one authenticated user's draft and its nested version history. The server route is used because deleting a Firestore parent document from the browser does not remove subcollections.

### `POST /api/product-events`

Accepts a small allowlisted authenticated product event. When `PRODUCT_TELEMETRY_ENABLED=true`, the server increments a content-free daily aggregate under `productMetrics/{day}`; otherwise it acknowledges the event without writing. Event properties are restricted to bounded enum/number fields.

### `GET /api/product-events/summary`

Returns aggregate event totals and funnel milestones for beta reporting. Requires a server-issued Firebase custom claim (`admin=true`, `role=admin`, or `role=founder`) and accepts an optional `limit` from 1 to 200 users. The response contains no draft text, repository URLs, prompts, tokens, or provider responses; the endpoint is bounded for occasional operator reporting rather than dashboard polling. The reviewed dry-run-first operator claim helper is `npm run set-beta-operator-claim`.

## Error handling and limits

Malformed repository identifiers, unsupported language/intent values, and unsupported draft refinements are rejected at the route boundary. Authenticated AI routes use user-scoped rate limiting plus capability and unified daily reserved-cost ledgers. The automation processor uses transactional leases, idempotent run records, retries, and checkpoint advancement; deployed quota, scheduler, and production-auth verification remain operational gates.
