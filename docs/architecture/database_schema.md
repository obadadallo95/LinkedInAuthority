# Persistence and Firestore Rules

The current beta uses Firebase Authentication for identity and Firestore for user-scoped persistence. This document describes the collections used by the live code, not a future billing or publishing schema.

## Current layout

```text
/users/{uid}
    /settings/current       authentication-linked settings and beta integration fields
    /projects/{projectId}   repository and monitoring configuration
    /drafts/{draftId}      generated draft content and metadata
    /posts/{postId}        client-managed post records used by legacy/dashboard flows
    /aiUsage/{usageId}     best-effort server-side AI usage telemetry
/rate_limits/{key_type}   server-side rate-limit state
```

## Important fields

### `users/{uid}/settings/current`

- `githubUsername`: connected GitHub profile handle.
- `githubToken`: current beta limitation; stored for the existing authenticated client/API flow and not a dedicated server-side token vault.
- `linkedinToken`: legacy field. LinkedIn publishing is not implemented and the current settings flow clears this value.
- `githubProfile` / `linkedinProfile`: cached profile metadata.
- `plan`, `role`, `isFounder`, `isPaidSubscription`: server-managed entitlement fields. Ordinary clients cannot create or modify these fields under `firestore.rules`.

### `users/{uid}/projects/{projectId}`

Stores repository identity, monitoring configuration, activity checkpoints, and the best-effort processing lease used by the automation route.

### `users/{uid}/drafts/{draftId}`

Stores generated content, title, status, source project, automation metadata, and timestamps. Automated monitoring writes here after successful draft generation.

### `users/{uid}/posts/{postId}`

Stores client-managed post records and status/card fields used by existing dashboard flows. It is separate from the server-written `drafts` collection and remains an area for future consolidation.

## Rules model

The rules default to deny and allow authenticated users to access only their own user document tree. Settings writes validate selected field types and prevent ordinary clients from changing entitlement fields. Firebase Admin operations used by the server bypass client Firestore rules.

The current rules do not provide a server-side token vault: a user can read their own settings document, including the legacy GitHub token field. This is documented beta limitation and requires a larger token-storage redesign.

## Retention and deletion

The application does not yet provide a verified, complete deletion or retention workflow across every collection. Do not treat the current delete action as proof of complete erasure or regulatory compliance.
