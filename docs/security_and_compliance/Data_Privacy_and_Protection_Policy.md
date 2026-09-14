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
- **Retention status:** A complete 30-day automated deletion cycle is not implemented in the current beta.
- **Token storage status:** GitHub integration tokens are currently stored in user settings for the authenticated client flow. This beta does not implement a dedicated encrypted token vault.

## 4. Data Subject Requests & "Right to be Forgotten"
The application includes a self-serve account deletion action, but it is not yet a verified mechanism for complete data deletion:
- Through the `SettingsPanel` inside the application, users can trigger the `handleDeleteAccount` function.
- The current action deletes some authentication, settings, and post records. Drafts, projects, usage data, and other collections require additional verification.
- The current account deletion flow does not yet guarantee removal from every collection and must not be represented as complete GDPR erasure.

## 5. Third-Party Sharing
Customer data (specifically code context) is shared strictly with the configured LLM provider (Google Gemini API) for the sole purpose of generating content. The platform does not sell, rent, or voluntarily share user data with advertising networks or unauthorized third parties.
