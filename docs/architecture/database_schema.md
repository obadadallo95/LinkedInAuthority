# Persistence and Firestore Rules

The current beta uses Firebase Authentication for identity and Firestore for user-scoped persistence. This document describes the collections used by the live code, not a future billing or publishing schema.

## Current layout

```text
/users/{uid}
    /settings/current       authentication-linked settings and non-secret beta preferences
    /privateCredentials/github  server-only encrypted GitHub credential
    /repositorySnapshots/{repoId}/versions  bounded repository evidence snapshots
    /projects/{projectId}   repository and monitoring configuration
        /automationRuns/{runId} idempotent automation history
    /drafts/{draftId}      generated draft content and metadata
        /versions/{revision} immutable snapshots (`0` = original AI draft; later revisions = manual saves)
    /usageLedger/{day}     server-side capability counters plus unified daily reserved-cost total
    /posts/{postId}        client-managed post records used by legacy/dashboard flows
    /aiUsage/{usageId}     best-effort server-side AI usage telemetry
    /productMetrics/{day}  optional aggregate product-event counters (content-free; disabled by default; 180-day retention)
/rate_limits/{key_type}   server-side rate-limit state
```

## Important fields

### `users/{uid}/settings/current`

- `githubUsername`: connected GitHub profile handle.
- `githubToken`: legacy field only; new connections use `privateCredentials/github`. Existing records require a reviewed migration before Public Beta.
- `linkedinToken`: rejected by current client rules and stripped from client state. LinkedIn publishing is not implemented; any legacy production field requires a reviewed server-side cleanup/migration.
- `githubProfile` / `linkedinProfile`: cached profile metadata.
- `plan`, `role`, `isFounder`, `isPaidSubscription`: server-managed entitlement fields. Ordinary clients cannot create or modify these fields under `firestore.rules`.

### `users/{uid}/projects/{projectId}`

Stores repository identity, monitoring configuration, activity checkpoints, and the best-effort processing lease used by the automation route. `lastObservedActivity` advances when activity has been consumed, including non-meaningful/noise activity; `lastContentGeneratedFrom` advances only after a draft is persisted. Legacy `lastProcessed*` fields remain as a compatibility mirror during migration and are server-managed by Firestore rules.

### `users/{uid}/drafts/{draftId}`

Stores generated content, title, status, source project, automation metadata, timestamps, and a monotonic `revision`. Draft creation writes an immutable `/versions/0` original-AI snapshot; manual saves use a Firestore transaction that updates the draft and writes an immutable `/versions/{revision}` snapshot together. A stale expected revision is rejected instead of overwriting a newer edit.

### `users/{uid}/posts/{postId}`

Stores client-managed post records and status/card fields used by existing dashboard flows. It is separate from the server-written `drafts` collection and remains an area for future consolidation.

## Rules model

The rules default to deny and allow authenticated users to access only their own user document tree. Settings writes validate selected field types and prevent ordinary clients from changing entitlement fields. Firebase Admin operations used by the server bypass client Firestore rules.

New credentials are stored under the Admin-only `privateCredentials/github` record and are not readable by the client. Repository snapshots contain bounded selected evidence and metadata, not an unrestricted repository mirror. Existing legacy `settings.githubToken` records may remain until the dry-run-first migration command is reviewed and explicitly committed; target-project execution and key provisioning remain a Public Beta gate.

## Retention and deletion

The application provides a protected retention job for operational records and an Admin recursive account deletion endpoint. User-authored content is retained until account deletion; scheduled cleanup does not remove drafts or projects. Missing/invalid retention timestamps are retained for safety. Production deployments must verify the cron job and deletion flow against the deployed Firebase project before making a regulatory claim.
