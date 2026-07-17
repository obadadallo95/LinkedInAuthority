# Data Privacy and Protection Policy

**System:** LinkedIn Authority Engine
**Version:** 1.0
**Date:** 2026-07-16

## 1. Purpose
This policy establishes the minimum standards for protecting customer data (including personal data, source code context, and integration tokens) within the LinkedIn Authority Engine platform, in alignment with SOC 2 Confidentiality criteria and global privacy standards (e.g., GDPR).

## 2. Data Classification
All data processed by the platform is classified into two tiers:
1. **Confidential Customer Data:** GitHub Personal Access Tokens, LinkedIn OAuth Tokens, source code snippets processed by the AI, and user email addresses.
2. **System Telemetry Data:** Aggregated usage logs and performance metrics (stripped of PII).

## 3. Data Minimization and Retention
To limit exposure and reduce unnecessary database (Firestore) costs, the platform strictly adheres to a data minimization strategy:
- **Temporary Processing:** Source code fetched from GitHub is processed in memory by the Gemini AI and is **not** persisted to the database. Only the generated outcome (LinkedIn post drafts) is stored.
- **30-Day Auto-Deletion Policy:** All user-generated drafts, scheduled posts, and activity logs are subject to a 30-day retention cycle. Any data older than 30 days is automatically purged from the system. 
- **Token Storage:** User OAuth tokens are stored exclusively for the duration of the user's active session or as long as the user maintains the connection. If the user disconnects an integration, the token is instantly hard-deleted from Firestore.

## 4. Data Subject Requests & "Right to be Forgotten"
The platform provides an automated self-serve mechanism for complete data deletion:
- Through the `SettingsPanel` inside the application, users can trigger the `handleDeleteAccount` function.
- This action explicitly performs a hard delete of:
  1. All generated posts and drafts.
  2. All user configuration settings and OAuth tokens.
  3. The user's underlying Firebase Authentication profile.
- Once executed, data recovery is impossible, satisfying GDPR "Right to be Forgotten" requirements.

## 5. Third-Party Sharing
Customer data (specifically code context) is shared strictly with the configured LLM provider (Google Gemini API) for the sole purpose of generating content. The platform does not sell, rent, or voluntarily share user data with advertising networks or unauthorized third parties.
