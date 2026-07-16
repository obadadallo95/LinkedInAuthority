# Developer Handoff & Technical Onboarding Guide

This document is compiled as a professional engineering guide for full-stack developers taking over development of the **LinkedIn Authority [PRO]** software platform.

---

## 1. Onboarding Quick-Start Checklist

1. **Verify Environment Requirements**:
   - Ensure you are running Node.js **v18+** or **v20+** with npm on your workspace system.
2. **Install Core Packages**:
   - Run `npm install` to download dependencies cleanly.
3. **Setup Environment Variables**:
   - Duplicate `.env.example` as `.env`.
   - Populated the required `GEMINI_API_KEY` for artificial intelligence tasks.
4. **Boot Development Environment**:
   - Run `npm run dev` to boot both the Express server on port `3000` and the integrated Vite asset compiler.
5. **Lint and Type Check**:
   - Run `npm run lint` to execute Type checking and ensure the workspace compiles without error.

---

## 2. Core Scripts & Command Reference

The available scripts in `package.json` are carefully engineered to accommodate both server-side transpilation and frontend hot-reloading:

- `npm run dev`: Boots the Express proxy server via `tsx` (TypeScript Executor). If `NODE_ENV` is not set to `"production"`, the server automatically mounts the Vite middleware to bundle assets and serve them in real-time.
- `npm run build`: Dual-stage build pipeline:
  1. Frontend: Runs `vite build` to compile the React SPA into static bundles in `dist/`.
  2. Backend: Compiles and bundles `server.ts` using `esbuild` with the flags `--platform=node --format=cjs --packages=external` to output a unified `dist/server.cjs` file.
- `npm run start`: Boots the standalone compiled full-stack application using `node dist/server.cjs` in production mode.
- `npm run lint`: Verifies type-safety across all components using `tsc --noEmit`.

---

## 3. High-Performance Build Design

### Why do we compile `server.ts` to CommonJS (`dist/server.cjs`)?
Modern Node.js runtime engines enforce highly strict and fragile path resolution checks when running native ES Modules (e.g. demanding explicit `.js` suffixes on all local imports). 

By bundling the backend server through `esbuild` into a single, compiled, self-contained `server.cjs` file, we:
- Resolve all relative import paths at build-time, completely bypassing Node's runtime import checks.
- Prevent file resolution crashes inside Docker or container platforms.
- Speed up cold starts by minimizing runtime filesystem I/O operations.
- Avoid exposing original source code in production environments.

---

## 4. State Management Lifecycle

- **Authentication State**: Handled globally inside `/src/application/AuthContext.tsx`. Coordinates state listeners via `onAuthStateChanged` using the Firebase Auth SDK.
- **Form States**: Fully decoupled inside individual forms with transient state syncing to Firestore documents upon user actions.
- **Data Hydration**: Real-time subscriptions are initialized at application boot-up using `onSnapshot`. If a database session isn't available, the app falls back to local storage and offline caches to ensure an uninterrupted user experience.

---

## 5. Roadmap for Future Engineers

If you are expanding the capabilities of LinkedIn Authority, here are the designated implementation pathways:

### A. Paid Subscription & Paywalls (Future PRO Mode)
- **Database Hook**: The header component reads `settings?.isPaidSubscription` to conditionally render the "PRO" badge or prompt subscription options.
- **Implementation**: Connect a webhook endpoint inside `server.ts` (e.g. `/api/webhooks/stripe`) to catch checkout events and update `users/{uid}/settings/current` field `isPaidSubscription` to `true`.

### B. Direct LinkedIn API Integration
- **OAuth setup**: Integrate the OAuth handshake via LinkedIn’s OpenID Connect protocols.
- **Routing**: Create `/api/auth/linkedin` and `/api/auth/linkedin/callback` inside `server.ts` to securely exchange transient auth codes for long-lived bearer tokens, and save them masked under the user’s Firestore settings.

### C. Automated Cron Worker Posting
- **Task Runner**: Add a scheduler library (like `node-cron` or Cloud Scheduler) to periodically scan Firestore documents under `/users/{uid}/posts` where `status == "scheduled"` and current time matches `scheduledDate` + `scheduledTime`.
- **Publisher**: Post the text and card graphics directly via the LinkedIn share endpoint.
