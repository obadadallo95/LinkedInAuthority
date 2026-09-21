# Systems Architecture & Design Patterns

> **Current-status note:** This document contains some historical design detail. The current source of truth is the root README and the live route/service code. LinkedIn publishing and LinkedIn OIDC are not implemented; new GitHub credentials use the server-side encrypted integration path, while legacy records still require migration.

This document details the high-level system architecture, client-side module decomposition, and full-stack orchestration patterns governing **LinkedIn Authority [PRO]**.

---

## 1. Structural Overview & System Topology

The platform is designed as a **Full-Stack Single-Page Application (SPA)** utilizing **React 19** on the client, **Vite** as the build and dev server middleware, and a modular **Node.js Express** backend server. It implements **Firebase Firestore** for durable cloud persistence and **Firebase Authentication** for secure multi-tenant isolation.

```text
                               +------------------------------------+
                               |     Client Browser Interface       |
                               | (React 19 SPA + Tailwind CSS v4)   |
                               +-----------------+--^---------------+
                                                 |  |
                                                 |  | Cloud Database & Auth
                                  User Actions   |  | State Synchronization
                                                 v  +--+
+------------------------------------------------------+-------------------------------------------------------+
|                                              Node.js Express Server                                          |
|                                                                                                              |
|   +--------------------------+    +--------------------------------------+    +--------------------------+   |
|   |   Static Assets Engine   |    |         Secure API Router            |    |  LLM Inference Pipeline  |   |
|   |  (React SPA Static File  |    |  (GitHub Repository Proxies,       |    |  (Google GenAI SDK via   |   |
|   |   Serving & Fallbacks)   |    |   Firebase Auth)                   |    |   configured model       |   |
|   +--------------------------+    +--------------------------------------+    +--------------------------+   |
+--------------------------------------------------------------------------------------------------------------+
                                                         |
                                                         v
                                              +--------------------+
                                              | Google Firestore   |
                                              | Cloud Database     |
                                              +--------------------+
```

---

## 2. Server-Side Architecture (`server.ts`)

The current beta keeps Gemini secrets server-side. New GitHub integration credentials are encrypted in an Admin-only record; legacy user-scoped token records remain a documented migration limitation.

### Key Components:
- **Port Orchestration**: Listens strictly on port `3000` and binds to host `0.0.0.0` for universal container ingress.
- **Lazy SDK Initialization**: The Google GenAI SDK client is lazy-loaded at the route boundary (`getGeminiClient()`) to prevent immediate module crashes during initial system cold-starts if env variables are pending configuration.
- **Versioned Service Worker Handler**: Serves a versioned static-shell cache with network-first navigation, removes only older LinkedIn Authority caches, and excludes `/api` so authenticated drafts, credentials, and live product data are never served from stale cache.
- **Vite Integration**:
  - In **Development** mode: Mounts `vite.createServer({ middlewareMode: true })` to enable hot reload and server-side static-routing injection.
  - In **Production** mode: Serves optimized static assets compiled inside `dist/` and redirects wildcard routing back to `dist/index.html` (complying with modern Express SPA standards).

---

## 3. Client Architecture

The client-side layout is heavily modularized to maintain small file boundaries, optimize compilation times, and prevent bundle token limits.

### Directory Structure Map:
- `/src/components/Analytics/`: Contains high-fidelity interactive Recharts components. Features `AnalyticsPanel.tsx` and `GrowthChart.tsx` complete with localized predictive growth sandboxes.
- `/src/components/Drafts/`: Handles generated content previews, social card renders, scheduling options, and content tags.
- `/src/components/Layout/`: Manages the visual frame including sidebars, custom-engineered responsive headers, and legal compliance screens.
- `/src/application/`: Auth Context layer provider interfacing with Firebase SDKs.
- `/src/services/`: Client-side abstraction for secondary services such as the local GitHub proxy.
- `/src/utils/`: High-performance auxiliary helpers including dates parsing and exports engine.

---

## 4. Design Language & Styling (Tailwind CSS v4)

The dashboard leverages **Tailwind CSS v4** with custom-themed font mappings and deep semantic color pairs:
- **Display Typography**: Paired Space Grotesk (tech aesthetics) with Inter (UI readability) and JetBrains Mono (terminal readouts and code telemetry).
- **Glassmorphism Theme**: Utilizes fine dark slate borders (`border-white/5`), translucent slate backing (`bg-slate-900/40`), and background blur effects (`backdrop-blur-md`) to construct high-contrast editorial structures without cluttered layouts.
- **Responsive Sizing**: Touch-targets are kept at minimums of `44px` on smaller screen ports, with adaptive flex wrappers that reflow smoothly to desktop panels.

---

## 5. Localization System (`src/constants.ts`)

The interface features an enterprise-grade translation dictionary supporting:
1. **Arabic (`ar`)** - Primary RTL translation complete with native font scales.
2. **English (`en`)** - Primary LTR translations.
3. **German (`de`)** - Primary European translations.

Locale transitions are managed by passing a `lang` state through components. Dynamic date strings in charts and tooltips automatically read `lang` to toggle Arabic Eastern numerals or Standard Western formatting on the fly.
