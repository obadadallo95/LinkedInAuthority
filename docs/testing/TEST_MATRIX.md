# LinkedIn Authority Test Matrix

## Phase 1: Product Inventory

### Pages & Routes
- [x] Landing Page (`/`)
- [x] Onboarding Wizard (`/onboarding`)
- [x] Repositories Dashboard (`/repos`)
- [x] Repo Details (`/repo/:owner/:name`)
- [x] Drafts Dashboard (`/drafts`)
- [x] Settings Panel (`/settings`)
- [x] Templates Panel (`/templates`)

### Components
- [x] GeneratorModal
- [x] Sidebar / Header / MobileNav
- [x] FloatingHelpWidget / AboutUsModal / LegalModal
- [x] PwaPrompt

### APIs
- [x] Public (Demo): `/api/demo/analyze`, `/api/demo/generate`
- [x] Authenticated: `/api/ai/analyze-repo`, `/api/ai/generate-post`, `/api/ai/generate-hashtags`, `/api/ai/optimize-post`

### Intelligence Engine
- [x] `collectEvidence.ts`
- [x] `analyzeRepository.ts`
- [x] `rankAngles.ts`
- [x] `auditClaims.ts`
- [x] `generatePost.ts`
- [x] `languageEditor.ts`
- [x] `prompts.ts`, `schemas.ts`, `token.ts`

### Workflows
- [x] Demo Flow (Landing -> Repo Details -> Generate)
- [x] Auth Flow (Dashboard -> Select Repo -> Generate -> Save Draft)
- [x] Drafts Management

### Cross-Cutting
- [x] RTL/Languages (Arabic, English, German)
- [x] Rate Limiting (Demo limit, Auth limit)
- [x] Security (AnalysisToken integrity)
- [x] Error Handling (GitHub 404, Gemini 503)

---

## Phase 2: Audit Results (Automated & Manual)

### Static Validation
- **TypeScript Compilation (`npm run tsc`)**: Pass ✅
- **Linting (`npm run lint`)**: Pass ✅
- **Build (`npm run build`)**: Pass ✅ (Fixed `vite:import-analysis` errors and outdated tests)

### Component & Flow Tests (Automated)
- **SettingsContext**: Pass ✅
- **PostsContext**: Pass ✅
- **PostEditor**: Pass ✅ (Fixed async state and `waitFor` timeouts by replacing fake timers with real timers for fetch resolution)
- **RepositoriesDashboard**: Pass ✅ (Removed outdated DOM assertions relying on checkboxes and smart generate buttons that were removed in a UI redesign)
- **RepoSparkline**: Pass ✅
- **locales**: Pass ✅

### Intelligence Engine Contracts (Automated)
- **Token Security (`test/engine.test.ts`)**: Pass ✅ (Signing and verifying works correctly, validating atomic facts, conflicts, and audience payloads).
- **Backend APIs (`test/routes/ai.test.ts`)**: Pass ✅ (Handles errors properly, validates missing params, returns properly structured JSON).
- **Engine Acceptance (`test/acceptance.ts`)**: Pass ✅

### Manual Smoke Test Readiness
- Fixtures have been generated and stored in `test/fixtures/` (`github_keyfixer.json`, `github_sama.json`).
- `manual_qa_checklist.md` has been generated for Phase 4 execution.
