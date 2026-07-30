export interface LogEntry {
  timestamp: string;
  action: string;
  status: "success" | "error" | "warning" | "info";
  message: string;
  details?: string;
}

const connectionLogs: LogEntry[] = [];
let logListeners: (() => void)[] = [];

export function addConnectionLog(
  action: string,
  status: "success" | "error" | "warning" | "info",
  message: string,
  details?: string
) {
  const newEntry: LogEntry = {
    timestamp: new Date().toLocaleTimeString(),
    action,
    status,
    message,
    details
  };
  connectionLogs.unshift(newEntry);
  if (connectionLogs.length > 50) {
    connectionLogs.pop();
  }
  logListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error("Error in log listener:", e);
    }
  });
}

export function getConnectionLogs(): LogEntry[] {
  return [...connectionLogs];
}

export function subscribeToLogs(listener: () => void) {
  logListeners.push(listener);
  return () => {
    logListeners = logListeners.filter(l => l !== listener);
  };
}

export async function fetchRateLimit(token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  try {
    const res = await fetch("https://api.github.com/rate_limit", { headers });
    const remainingHeader = res.headers.get("X-RateLimit-Remaining") || "";
    const limitHeader = res.headers.get("X-RateLimit-Limit") || "";
    
    if (res.ok) {
      const data = await res.json();
      const limit = (data.resources?.core?.limit ?? Number(limitHeader)) || 60;
      const remaining = (data.resources?.core?.remaining ?? Number(remainingHeader)) || 0;
      const reset = data.resources?.core?.reset ?? (Math.floor(Date.now() / 1000) + 3600);
      addConnectionLog(
        "Fetch Rate Limit",
        remaining > 10 ? "success" : "warning",
        `Current limit: ${remaining}/${limit}. Resets at ${new Date(reset * 1000).toLocaleTimeString()}`,
        `Reset Unix Timestamp: ${reset}`
      );
      return { limit, remaining, reset };
    } else {
      addConnectionLog(
        "Fetch Rate Limit",
        "error",
        `Failed with status ${res.status}`,
        `HTTP Error: ${res.statusText}`
      );
      return null;
    }
  } catch (err: any) {
    addConnectionLog(
      "Fetch Rate Limit",
      "error",
      `Connection failed: ${err.message || err}`
    );
    return null;
  }
}

export async function checkTokenScopes(token: string) {
  if (!token) {
    addConnectionLog("Check Permissions", "error", "No Personal Access Token was supplied to validate.");
    return { valid: false, scopes: [], hasRepoScope: false, error: "No token provided" };
  }
  
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${token}`,
  };

  addConnectionLog("Check Permissions", "info", "Sending validation request to GitHub API `/user` endpoint...");

  try {
    const res = await fetch("https://api.github.com/user", { headers });
    const scopesHeader = res.headers.get("X-OAuth-Scopes") || res.headers.get("x-oauth-scopes") || "";
    const scopes = scopesHeader ? scopesHeader.split(",").map(s => s.trim()) : [];
    const hasRepoScope = scopes.includes("repo") || scopes.some(s => s.startsWith("repo:"));

    if (res.ok) {
      const userObj = await res.json().catch(() => ({}));
      addConnectionLog(
        "Check Permissions",
        hasRepoScope ? "success" : "warning",
        hasRepoScope 
          ? `Token is VALID for user "${userObj.login || "unknown"}". Authorized scopes: [${scopes.join(", ")}]. 'repo' access is fully granted!` 
          : `Token is VALID but MISSING required 'repo' scope (found: [${scopes.join(", ")}]). This will cause 403 Forbidden errors when loading private/organizational repos.`,
        `HTTP Status: ${res.status}. Scopes header: "${scopesHeader}"`
      );
      return { valid: true, scopes, hasRepoScope, error: null };
    } else {
      let errorMsg = `GitHub API error status ${res.status}`;
      if (res.status === 401) {
        errorMsg = "Unauthorized: The Personal Access Token is invalid, expired, or has been revoked.";
      } else if (res.status === 403) {
        errorMsg = "Forbidden: Access denied or IP rate-limited on the shared hosting container.";
      }
      addConnectionLog("Check Permissions", "error", errorMsg, `HTTP Status: ${res.status}`);
      return { valid: false, scopes: [], hasRepoScope: false, error: errorMsg };
    }
  } catch (err: any) {
    const errMsg = err.message || err;
    addConnectionLog("Check Permissions", "error", `Failed to contact GitHub: ${errMsg}`);
    return { valid: false, scopes: [], hasRepoScope: false, error: errMsg };
  }
}

export async function fetchProfile(username: string, token?: string) {
  // handled within /api/settings post in current implementation
}

export async function fetchRepos(username: string, token?: string, orgFilter?: string) {
  const headersWithToken: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headersWithToken.Authorization = `token ${token}`;
  }

  const headersNoToken: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  addConnectionLog(
    "Fetch Repositories",
    "info",
    `Initiating repository load for "${username}" (Filter: ${orgFilter || 'Personal'}, Token: ${token ? 'Present' : 'None'})`
  );

  // Build the list of attempts to make
  const attempts: { url: string; headers: Record<string, string>; description: string }[] = [];

  if (orgFilter && orgFilter !== 'Personal') {
    if (token) {
      attempts.push({
        url: `https://api.github.com/orgs/${orgFilter}/repos?sort=updated&per_page=100`,
        headers: headersWithToken,
        description: `org repos with token`
      });
    }
    attempts.push({
      url: `https://api.github.com/orgs/${orgFilter}/repos?sort=updated&per_page=100`,
      headers: headersNoToken,
      description: `org repos without token`
    });
  } else {
    if (token) {
      attempts.push({
        url: `https://api.github.com/user/repos?sort=updated&per_page=100`,
        headers: headersWithToken,
        description: `user repos with token`
      });
      attempts.push({
        url: `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
        headers: headersWithToken,
        description: `username repos with token`
      });
    }
    attempts.push({
      url: `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      headers: headersNoToken,
      description: `username repos without token`
    });
  }

  for (const attempt of attempts) {
    try {
      console.log(`GitHub Fetch: Attempting ${attempt.description}...`);
      addConnectionLog(
        "Fetch Repositories",
        "info",
        `Trying request via ${attempt.description}...`,
        `URL: ${attempt.url}`
      );
      
      const res = await fetch(attempt.url, { headers: attempt.headers });
      
      const rateLimitRemaining = res.headers.get("X-RateLimit-Remaining");
      const scopesHeader = res.headers.get("X-OAuth-Scopes") || "";

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          console.log(`GitHub Fetch: Successfully loaded ${data.length} repos using ${attempt.description}.`);
          addConnectionLog(
            "Fetch Repositories",
            "success",
            `Successfully loaded ${data.length} live repositories via "${attempt.description}".`,
            `Status: ${res.status}. Scopes: [${scopesHeader || 'none'}]. Rate Limit Remaining: ${rateLimitRemaining || 'unknown'}`
          );
          return data;
        }
      } else {
        console.warn(`GitHub Fetch: ${attempt.description} returned status ${res.status}`);
        let errorType: "error" | "warning" = "warning";
        let msg = `Request returned status ${res.status} for ${attempt.description}`;
        if (res.status === 403) {
          msg = `HTTP 403 Forbidden: Shared rate limit exceeded or token has insufficient permissions.`;
          errorType = "error";
        } else if (res.status === 401) {
          msg = `HTTP 401 Unauthorized: Personal Access Token is invalid or expired.`;
          errorType = "error";
        }
        addConnectionLog(
          "Fetch Repositories",
          errorType,
          msg,
          `URL: ${attempt.url}. Status: ${res.status}. Rate Limit Remaining: ${rateLimitRemaining || 'unknown'}`
        );
      }
    } catch (err: any) {
      const errMsg = err.message || err;
      console.warn(`GitHub Fetch: ${attempt.description} failed with error:`, errMsg);
      addConnectionLog(
        "Fetch Repositories",
        "error",
        `Connection failed for ${attempt.description}: ${errMsg}`,
        `URL: ${attempt.url}`
      );
    }
  }

  console.warn(`GitHub Fetch: All attempts to fetch live repos for ${username} failed. Returning local fallback list.`);
  addConnectionLog(
    "Fetch Repositories",
    "warning",
    `All live fetch attempts failed. Returning local sandbox fallback repository list instead.`
  );
  throw new Error("All live fetch attempts failed.");
}

export async function fetchOrgs(username: string, token?: string) {
  const headersWithToken: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headersWithToken.Authorization = `token ${token}`;
  }

  const headersNoToken: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  addConnectionLog(
    "Fetch Organizations",
    "info",
    `Initiating organization load for "${username}"`
  );

  const attempts: { url: string; headers: Record<string, string>; description: string }[] = [];
  if (token) {
    attempts.push({
      url: `https://api.github.com/user/orgs`,
      headers: headersWithToken,
      description: `user orgs with token`
    });
    attempts.push({
      url: `https://api.github.com/users/${username}/orgs`,
      headers: headersWithToken,
      description: `username orgs with token`
    });
  }
  attempts.push({
    url: `https://api.github.com/users/${username}/orgs`,
    headers: headersNoToken,
    description: `username orgs without token`
  });

  for (const attempt of attempts) {
    try {
      addConnectionLog(
        "Fetch Organizations",
        "info",
        `Attempting organization fetch via ${attempt.description}...`
      );
      const res = await fetch(attempt.url, { headers: attempt.headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          addConnectionLog(
            "Fetch Organizations",
            "success",
            `Successfully loaded ${data.length} organizations via ${attempt.description}`
          );
          return data;
        }
      } else {
        addConnectionLog(
          "Fetch Organizations",
          "warning",
          `Attempt returned HTTP ${res.status} for ${attempt.description}`
        );
      }
    } catch (err: any) {
      addConnectionLog(
        "Fetch Organizations",
        "error",
        `Attempt failed for ${attempt.description}: ${err.message || err}`
      );
      console.warn(`GitHub Fetch Orgs: ${attempt.description} failed:`, err);
    }
  }

  return [];
}

export async function fetchReadme(username: string, repo: string, token?: string, isFallback?: boolean) {

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const url = `https://api.github.com/repos/${username}/${repo}/readme`;

  addConnectionLog(
    "Fetch README",
    "info",
    `Attempting to fetch README for ${username}/${repo}`
  );

  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.content) {
        const decoded = atob(data.content.replace(/\s/g, ''));
        try {
          const utf8Decoded = decodeURIComponent(escape(decoded));
          addConnectionLog("Fetch README", "success", `Successfully fetched and decoded README for ${repo}`);
          return utf8Decoded;
        } catch {
          addConnectionLog("Fetch README", "success", `Successfully fetched README for ${repo}`);
          return decoded;
        }
      }
    } else {
      const rawUrl = `https://raw.githubusercontent.com/${username}/${repo}/master/README.md`;
      const rawRes = await fetch(rawUrl);
      if (rawRes.ok) {
        const text = await rawRes.text();
        addConnectionLog("Fetch README", "success", `Successfully fetched raw master README for ${repo}`);
        return text;
      }

      const mainUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/README.md`;
      const mainRes = await fetch(mainUrl);
      if (mainRes.ok) {
        const text = await mainRes.text();
        addConnectionLog("Fetch README", "success", `Successfully fetched raw main README for ${repo}`);
        return text;
      }

      addConnectionLog(
        "Fetch README",
        "warning",
        `HTTP ${res.status} returned for README fetch on ${repo}. Serving fallback.`
      );
    }
  } catch (err: any) {
    addConnectionLog(
      "Fetch README",
      "error",
      `Failed to fetch README for ${repo}: ${err.message || err}`
    );
  }

  return `
# ${repo}
No online README.md could be retrieved.
- Codebase contains active TypeScript and design configurations.
- Star count and other repository statistics are loaded live from your developer profile.
`;
}


export async function fetchRepoTree(username: string, repo: string, branch: string = 'main', token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const url = `https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`;

  addConnectionLog(
    "Fetch Tree",
    "info",
    `Attempting to fetch file tree for ${username}/${repo} on branch ${branch}`
  );

  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      addConnectionLog("Fetch Tree", "success", `Successfully fetched file tree for ${repo}`);
      return data.tree || [];
    } else {
      addConnectionLog("Fetch Tree", "warning", `Failed to fetch file tree. Status: ${res.status}`);
      return [];
    }
  } catch (err: any) {
    addConnectionLog("Fetch Tree", "error", `Error fetching tree: ${err.message || err}`);
    return [];
  }
}
