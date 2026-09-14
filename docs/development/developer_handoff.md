# Developer Handoff

LinkedIn Authority is an active-development React/Vite and Express beta. The repository is intentionally not a completed LinkedIn publishing product.

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Configure `GEMINI_API_KEY`, `ANALYSIS_SIGNING_SECRET`, and `CRON_SECRET`. The cron route has no default secret. Firebase Admin calls require Google Application Default Credentials or an explicitly configured service-account environment.

## Commands

- `npm run dev`: starts the Express server with Vite middleware for development.
- `npm run lint`: runs the TypeScript compiler in no-emit mode.
- `npm test`: runs the Vitest suite.
- `npm run build`: builds the Vite client and bundles `server.ts` into `dist/server.cjs`.
- `npm run start`: starts the compiled server bundle.

## Runtime boundaries

- Firebase Auth provides Google/GitHub sign-in and ID tokens.
- Express verifies Firebase ID tokens before protected AI routes.
- GitHub services fetch repository context and recent activity.
- Repository intelligence produces structured evidence before Gemini generation.
- Firestore stores user-scoped settings, projects, drafts, monitoring state, and best-effort AI telemetry.

## Development limitations

- Direct LinkedIn publishing, LinkedIn OAuth, and official LinkedIn analytics are not implemented.
- Automation stores drafts after repository activity changes; it does not publish externally.
- GitHub integration tokens remain in the current user settings flow as a documented beta limitation.
- Entitlement fields are written through the Admin SDK and protected from ordinary client writes.

For the current endpoint list and data model, see the [API reference](../api/API.md) and [persistence guide](../architecture/database_schema.md).
