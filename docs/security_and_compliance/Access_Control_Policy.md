# Access Control Policy

**System:** LinkedIn Authority Engine
**Version:** 1.0
**Date:** 2026-07-16

## 1. Objective
To outline the mechanisms and policies governing access to both the application runtime environment and the underlying infrastructure, ensuring adherence to the principle of least privilege.

## 2. Customer Access Controls
- **Authentication Mechanism:** All end-user access is governed by Firebase Authentication using secure OAuth 2.0 flows (Google, GitHub, LinkedIn).
- **Data Isolation:** Access to the database is rigidly enforced at the request level. A user can only execute CRUD (Create, Read, Update, Delete) operations on their specific `uid` path (`/users/{userId}/*`). This zero-trust boundary is maintained purely by Firestore Security Rules, independent of client-side logic.
- **Session Management:** User sessions are managed by Firebase SDK tokens which automatically expire and refresh. Revoking access logs the user out globally.

## 3. Administrative / Internal Access Controls
Currently, the platform operates without dedicated internal support staff or custom administrative dashboards.
- **Infrastructure Access:** Only the System Administrator is granted access to the Google Cloud Console and Firebase Console.
- **MFA Requirement:** All administrative access to the infrastructure requires Multi-Factor Authentication (MFA).
- **Zero-Trust for Customer Data:** The administrator does not access, read, or utilize customer raw code snippets or tokens for any purpose other than automated system processing. Any debugging of user issues is done via aggregated metrics or through explicit user consent where the user reproduces the issue.

## 4. API & Secret Access
- Application secrets (e.g., Gemini API keys, OAuth Client Secrets) are stored within Google Cloud Secret Manager.
- The Firebase App Hosting service account is granted the precise `secretmanager.versions.get` permission required to read these secrets at runtime.
- Developers cannot access the plaintext secrets in the source code repository.

## 5. Review and Auditing
- Access logs for the Google Cloud environment are enabled via Cloud Audit Logs.
- Firestore Security Rules are reviewed and tested during CI/CD to prevent regressions that could inadvertently open data to unauthorized paths.
