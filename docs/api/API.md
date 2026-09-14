# API Reference

This is the current Express route surface. The application is an active beta; this document describes implemented routes only.

## Authentication

`GET /api/health` and the demo routes are unauthenticated. The remaining `/api` routes require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

GitHub integration tokens may be supplied by the current authenticated client flow. Gemini secrets are loaded only by the server. LinkedIn OAuth and publishing endpoints are not implemented.

## Implemented routes

### `GET /api/health`

Returns a basic server health response.

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

Optional fields include `token`, `projectDescription`, `lang`, and `intent`.

### `POST /api/generate-post`

Generates a post from a valid analysis token. The token is checked for user, repository, audience, language, signature, and expiry before generation.

### `POST /api/analyze-commits`

Creates a structured technical update from recent commit summaries.

### `POST /api/generate-hashtags`

Returns generated hashtags for supplied post text.

### `POST /api/deep-scan`

Fetches repository identity and recent activity, synthesizes grounded context, and returns an editable draft plus a suggested call to action.

### `POST /api/cron/process-weekly`

Processes due repository-monitoring configurations and stores generated drafts. It requires a configured `CRON_SECRET`; there is no development fallback secret.

## Error handling and limits

Malformed repository identifiers and unsupported language/intent values are rejected at the route boundary. Authenticated AI routes use user-scoped rate limiting. The current beta still needs stricter per-field payload limits, transactional automation leases, and broader operational quotas.
