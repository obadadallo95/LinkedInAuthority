# Data Privacy and Protection Policy

**System:** LinkedIn Authority Engine
**Version:** 1.0
**Date:** 2026-07-16

## 1. Purpose
This document is a draft target policy for an active beta, not evidence that the controls below are fully implemented. Current implementation details and known limitations must be verified against the source code before relying on this document for compliance or security assurances.

## 2. Data Classification
All data processed by the platform is classified into two tiers:
1. **Confidential Customer Data:** GitHub Personal Access Tokens, LinkedIn OAuth Tokens, source code snippets processed by the AI, and user email addresses.
2. **System Telemetry Data:** Aggregated usage logs and performance metrics (stripped of PII).

## 3. Data Minimization and Retention
To limit exposure and reduce unnecessary database (Firestore) costs, the platform strictly adheres to a data minimization strategy:
- **Processing status:** Repository content is processed by Gemini for analysis and generation. Derived context and drafts may be persisted by the current application.
- **Retention status:** The protected `/api/cron/retention` job removes expired operational records: rate-limit state after 2 days, usage ledger entries and automation run history after 90 days, and repository snapshot versions after 30 days. Missing or invalid timestamps are retained. Drafts, projects, settings, and current repository snapshot pointers remain until the user deletes the account.
- **Token storage status:** New GitHub credentials are sent once to the server and stored encrypted in an Admin-only record. Private-repository access is disabled by default and only enabled when the server-side `githubPermissions=all` setting is explicitly selected. Existing legacy user-settings token records can be inventoried with the dry-run-first migration command; encrypted storage is verified before optional explicit removal of the legacy field.

## 4. Data Subject Requests & "Right to be Forgotten"
The application includes a self-serve account deletion action backed by an Admin recursive delete plus Firebase Auth deletion:
- Through the `SettingsPanel` inside the application, users can trigger the `handleDeleteAccount` function.
- The deletion endpoint removes the complete `users/{uid}` tree, including nested drafts, projects, automation runs, repository snapshots, usage records, and encrypted private credentials, then removes the Firebase Auth user.
- Operational failures return an explicit temporary-unavailable response and are logged for operator follow-up; production deletion verification should still be exercised against the deployed Firebase project before making a regulatory claim.

## 5. Third-Party Sharing
Customer data (specifically code context) is shared strictly with the configured LLM provider (Google Gemini API) for the sole purpose of generating content. The platform does not sell, rent, or voluntarily share user data with advertising networks or unauthorized third parties.
