# Database Schema & Persistence Guide

This document describes the durable cloud persistence layer designed for **LinkedIn Authority [PRO]** using **Google Cloud Firestore**.

---

## 1. Multi-Tenant Architecture

The system utilizes Firebase Authentication to identify users. All user data is isolated at the sub-collection level under a parent `users` collection. This secures multi-tenant data isolation and ensures strict compliance with user data privacy standards.

---

## 2. Document Models & Fields

Firestore structures are schema-less by nature, but this application enforces the following logical structures:

```text
/users/{uid}
    |
    +--- /settings/current  (Global integrations, GitHub, and Premium states)
    |
    +--- /posts/{postId}    (Saved LinkedIn drafts, scheduled posts, and card configurations)
```

### Collection: `users/{uid}/settings`
Contains the user's API integrations, tokens, and billing preferences.

#### Document: `current`
| Field | Type | Description |
| :--- | :--- | :--- |
| `githubUsername` | `string` | The connected GitHub profile handle. |
| `githubToken` | `string` | Encrypted/Masked token for GitHub API communication. |
| `linkedinToken` | `string` | Encrypted/Masked token for LinkedIn API communications. |
| `githubProfile` | `object` | Cached user metadata from GitHub (e.g. avatar, public repos count). |
| `linkedinProfile` | `object` | Cached user profile metadata (name, headline, avatar). |
| `isPaidSubscription` | `boolean` | Flag indicating whether the account has unlocked Pro features. |

---

### Collection: `users/{uid}/posts`
Tracks all generated posts, scheduling queues, and analytical simulations.

#### Document: `{postId}`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the document. |
| `repoName` | `string` | Name of the source GitHub repository. |
| `text` | `string` | The generated markdown content for LinkedIn. |
| `status` | `string` | `"draft" \| "scheduled" \| "published"` |
| `scheduledDate` | `string` | Target date string for published queues (e.g., `"2026-07-20"`). |
| `scheduledTime` | `string` | Target time string for queues (e.g., `"14:30"`). |
| `createdAt` | `string` | ISO timestamp of generation. |
| `tags` | `array<string>`| Selected high-relevance hashtags. |
| `cardConfig` | `object` | Visual parameters for social banner image generation: |
| `cardConfig.title` | `string` | Large display header on the generated graphic. |
| `cardConfig.subtitle` | `string` | Secondary descriptive text. |
| `cardConfig.metrics` | `string` | Key performance indicators (e.g. `"99.2% Performance"`). |
| `cardConfig.colorTheme` | `string` | Style identifier (`"indigo" \| "emerald" \| "amber" \| "rose" \| "slate"`). |

---

## 3. Firestore Security Rules (`firestore.rules`)

To prevent unauthorized access, Firestore database calls are protected by rules that restrict reading or writing to documents that do not belong to the currently authenticated user.

### Production Rules Definition:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restrict access so users can only view or modify their own sub-collections
    match /users/{userId}/{allSubCollections=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Local-First Isolation (Demo Mode)

For users who prefer to preview the system without a Cloud Connection or Firebase authentication, the application implements a local fallback state machine:
- Users can toggle **Demo Mode** in Settings.
- Repositories are populated with realistic developer profiles using cached fallback static mocks (`githubService.ts`).
- Posts are saved to `localStorage` utilizing standard state syncs to maintain high performance in offline or low-bandwidth conditions.
