# Backend API Specifications & Router Reference

This document provides exact, professional technical documentation for the primary full-stack API endpoints exposed by the **LinkedIn Authority [PRO]** Express server.

---

## 🔐 Authentication & Globals

All client-to-server operations require valid routing configurations. For third-party authentication proxies (e.g. GitHub OAuth), keys are masked and securely exchanged on the server-side to prevent client-side credential exposure.

---

## 🩺 System Diagnostic Endpoints

### 1. Health Status check
Determines server viability and container readiness.

- **Endpoint**: `GET /api/health`
- **Headers**: None
- **Query Parameters**: None
- **Response Format**: `JSON`

#### Successful Response (`200 OK`)
```json
{
  "status": "ok"
}
```

---

## 🧠 AI Analysis & Generation Endpoints

### 2. Analyze Codebase Repository
Reads repository metadata and `README.md` details to draft three high-impact LinkedIn posts and visual social card configurations tailored to specified templates and locales.

- **Endpoint**: `POST /api/analyze-repo`
- **Content-Type**: `application/json`
- **Request Body Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `repo` | `string` | **Yes** | Name of the GitHub repository (e.g. `"react-dashboard"`). |
  | `username` | `string` | No | GitHub username of the repository owner. |
  | `token` | `string` | No | Personal Access Token to authenticate against GitHub API. |
  | `branch` | `string` | No | Target branch to pull context from (defaults to default branch). |
  | `template` | `string` | No | Focus template: `"showcase" \| "educational" \| "leadership"`. |
  | `lang` | `string` | No | Target locale language code: `"ar" \| "en" \| "de"`. |

#### Response Format (`200 OK`)
```json
{
  "posts": [
    {
      "text": "🚀 Proud to share my open-source project: **react-dashboard**! Developed with modular layouts...",
      "cardConfig": {
        "colorTheme": "indigo",
        "title": "REACT-DASHBOARD",
        "subtitle": "Production-grade Code Release",
        "metrics": "99.2% SPEED"
      }
    },
    ...
  ]
}
```

#### Error Response (`400 Bad Request`)
Returned if `repo` name is missing:
```json
{
  "error": "Missing repository name parameter"
}
```

*Note: If the primary AI model `gemini-3.5-flash` or fallback `gemini-3.1-flash-lite` experiences service degradation, the endpoint automatically intercepts the exception and serves highly optimized, localized, fallback static drafts matching the requested language, ensuring 100% operational uptime.*

---

### 3. Generate Hashtags
Suggests 5-8 highly relevant, professional developer hashtags based on the post text to boost LinkedIn algorithm reach.

- **Endpoint**: `POST /api/generate-hashtags`
- **Content-Type**: `application/json`
- **Request Body Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `text` | `string` | **Yes** | The complete post text to generate tags for. |
  | `lang` | `string` | No | Target locale language code (e.g. `"en"`). |

#### Response Format (`200 OK`)
```json
{
  "hashtags": [
    "#webdev",
    "#typescript",
    "#opensource",
    "#reactjs",
    "#coding",
    "#softwareengineering"
  ]
}
```

#### Error Response (`400 Bad Request`)
Returned if `text` is missing:
```json
{
  "error": "Missing text parameter"
}
```

*Note: If AI servers are offline, the system catches the error and returns high-traffic developer hashtags seamlessly.*

---

## 📢 Social Integration Endpoints

### 4. Publish LinkedIn Post
Simulates authentic LinkedIn post broadcast and queues it for the feed.

- **Endpoint**: `POST /api/publish-post`
- **Content-Type**: `application/json`
- **Request Body Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `token` | `string` | **Yes** | LinkedIn secure Bearer token. |
  | `text` | `string` | **Yes** | Post content markdown. |
  | `repo` | `string` | No | Associated repository context. |

#### Response Format (`200 OK`)
```json
{
  "success": true,
  "postId": "urn:li:activity:7012345678910111213",
  "timestamp": "2026-07-16T15:53:10.000Z"
}
```

#### Error Responses
- **`401 Unauthorized`** (Returned if token is missing):
  ```json
  {
    "error": "LinkedIn personal access token is missing or unauthorized. Link your LinkedIn account in the settings panel."
  }
  ```
- **`400 Bad Request`** (Returned if post body is empty):
  ```json
  {
    "error": "Post text is empty"
  }
  ```

---

## 🐙 GitHub Integration (OAuth Handshake)

### 5. Get OAuth Authorize URL
Calculates and redirects the client to GitHub’s OIDC Authorize portal.

- **Endpoint**: `GET /api/oauth/github/url`
- **Response Format**: `JSON`

#### Successful Response (`200 OK`)
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=XYZ&redirect_uri=https://.../api/oauth/github/callback&scope=repo,user"
}
```

#### Error Response (`500 Internal Server Error`)
Returned if OAuth secrets are missing in `.env`:
```json
{
  "error": "GitHub Client ID not configured"
}
```

---

### 6. OAuth Authorization Redirect Gateway
Performs a direct 302 Redirect to the secure GitHub Authorization endpoint.

- **Endpoint**: `GET /api/oauth/github`
- **Response**: `302 Found (Redirect)`

---

### 7. OAuth Handshake Callback Gateway
Processes authorization code exchange and posts messages to the client frame.

- **Endpoint**: `GET /api/oauth/github/callback`
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `code` | `string` | **Yes** | Transient authorization code supplied by GitHub. |

#### Successful Handshake
Returns a script block utilizing `window.opener.postMessage` to send authorization tokens and user profile maps securely back to the parent app window, then initiates auto-closing.
```html
<script>
  if (window.opener) {
    window.opener.postMessage({
      type: 'oauth_success',
      accessToken: 'gho_abc123...',
      userData: { "login": "octocat", "id": 1, ... }
    }, window.location.origin);
  }
</script>
```
