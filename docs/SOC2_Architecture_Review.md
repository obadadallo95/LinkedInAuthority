# SOC 2 Architecture & Security Review

**System:** LinkedIn Authority Engine
**Version:** 1.0
**Date:** 2026-07-16

## 1. Executive Summary
This document provides a technical assessment of the LinkedIn Authority Engine against the SOC 2 Trust Services Criteria (TSC), focusing specifically on Security, Availability, and Confidentiality. The platform utilizes a serverless architecture deployed on Google Cloud Platform (Firebase App Hosting, Firestore, Firebase Authentication).

## 2. Trust Services Criteria Evaluation

### 2.1 Security (Logical & Physical Access Controls)
The system is designed with a "Zero-Trust" data access architecture:
- **Authentication:** All access requires successful authentication via Firebase Authentication (Google OAuth).
- **Tenant Isolation:** Firestore Security Rules enforce strict isolation. A user (tenant) can only read, write, or delete documents where the path aligns with their unique authenticated `uid` (`request.auth.uid == userId`). No cross-tenant reads are possible at the database layer.
- **Internal Access:** The platform operates with no internal administrative dashboard capable of reading raw user data (e.g., source code drafts). All employee access to the production Google Cloud environment requires Multi-Factor Authentication (MFA) and is restricted to infrastructure management, not data access.
- **Third-Party Providers:** The application leverages Google Cloud infrastructure, which holds independent SOC 2 Type II and ISO 27001 certifications. Future payment processing will be handled via a PCI-DSS compliant provider (e.g., Stripe) to ensure no payment data touches the application servers.

### 2.2 Confidentiality (Data Protection)
Customer data consists primarily of OAuth tokens, analyzed code snippets, and generated LinkedIn content.
- **Encryption in Transit:** All traffic is forced over HTTPS (TLS 1.2/1.3) through Firebase App Hosting and Google Cloud Load Balancing.
- **Encryption at Rest:** All data stored in Firestore is encrypted at rest by default using Google's AES-256 server-side encryption.
- **API Secret Management:** Highly sensitive system credentials (e.g., Gemini API keys) are never committed to source control and are accessed exclusively at runtime via Google Cloud Secret Manager.

### 2.3 Availability
- **Hosting Resilience:** The frontend and Next.js backend routes are deployed on Firebase App Hosting, which automatically scales to meet demand across Google's edge network.
- **Database Scaling:** Firestore provides automatic, highly available multi-region replication and scaling without manual intervention.

## 3. Scope of Automation
All compliance enforcements are codified as Infrastructure as Code (e.g., `firestore.rules`) and CI/CD deployment checks, ensuring that human error cannot inadvertently expose customer data.
