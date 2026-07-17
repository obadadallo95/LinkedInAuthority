# Testing Strategy & Guidelines

## Philosophy
Our testing strategy ensures that **LinkedIn Authority Engine** remains stable, performant, and bug-free across both frontend and backend layers. We prioritize **Integration Tests** and **Component Tests** over brittle unit tests.

## Running the Tests
We use `vitest` as our core test runner. It provides native TypeScript support and is significantly faster than Jest.

### Common Commands
- **Run all tests:** `npm run test`
- **Run in watch mode:** `npx vitest` (Useful during active development)
- **Run tests with UI:** `npx vitest --ui` (Provides a beautiful dashboard in the browser)

## What We Test
### 1. The "Happy Path"
Every core feature (e.g., Analyzing a repo, generating a post, publishing to LinkedIn) MUST have a test that verifies a user can complete the action from start to finish without errors.

### 2. Edge Cases & Error Handling
We must test how the system reacts to failures:
- What happens if the GitHub Repo URL is invalid?
- What happens if the LinkedIn API rejects our OAuth token?
- What happens if Gemini AI times out?

The UI should display appropriate error boundaries or modals (e.g., `ErrorModal`), and the backend should gracefully return 400/500 level status codes instead of crashing.

## Continuous Integration (CI)
All Pull Requests must pass the testing pipeline before they can be merged into `main`.
1. GitHub Actions will run `npm install`.
2. It will execute `npm run build` to ensure TypeScript compilation passes.
3. It will execute `npm run test` to verify no regressions were introduced.

## Mocking Strategy Overview
Because we are building a tool that heavily relies on external APIs (GitHub, LinkedIn, Google AI, Firebase), we must strictly mock these boundaries.
- No live database interactions.
- No live HTTP requests to external domains.
- We simulate time delays where necessary using `vi.useFakeTimers()`.

By adhering to this strategy, we guarantee that our SaaS product scales reliably and provides a flawless experience to our professional engineering users.
