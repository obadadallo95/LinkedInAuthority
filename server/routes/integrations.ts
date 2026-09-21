import { Router } from 'express';
import { deleteGithubCredential, getGithubCredentialForUser, GithubCredentialUnavailableError, saveGithubCredential, setGithubAccessScope } from '../services/githubCredentials';
import { recordProductEvent } from '../services/productTelemetry';
import { fetchWithTimeout } from '../services/github';

const router = Router();
const GITHUB_LIST_CACHE_TTL_MS = 5 * 60 * 1000;
const GITHUB_REPOSITORY_CACHE_TTL_MS = 5 * 60 * 1000;
type GithubListCacheEntry = { expiresAt: number; payload: unknown };
const githubListCache = new Map<string, GithubListCacheEntry>();
const githubRepositoryCache = new Map<string, GithubListCacheEntry>();
const githubInFlight = new Map<string, Promise<unknown>>();

function invalidateGithubListCache(userId: string): void {
  for (const key of githubListCache.keys()) {
    if (key.startsWith(`${userId}:`)) githubListCache.delete(key);
  }
  for (const key of githubRepositoryCache.keys()) {
    if (key.startsWith(`${userId}:`)) githubRepositoryCache.delete(key);
  }
}

async function cachedGithubValue<T>(cache: Map<string, GithubListCacheEntry>, key: string, loader: () => Promise<T>, ttlMs: number): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.payload as T;
  if (cached) cache.delete(key);
  const inFlight = githubInFlight.get(key);
  if (inFlight) return inFlight as Promise<T>;

  const request = loader()
    .then((payload) => {
      cache.set(key, { expiresAt: Date.now() + ttlMs, payload });
      return payload;
    })
    .finally(() => {
      githubInFlight.delete(key);
    });
  githubInFlight.set(key, request);
  return request;
}

router.post('/github/connect', async (req: any, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!token || token.length > 512) return res.status(400).json({ error: 'A valid GitHub credential is required.' });

  try {
    const profileResponse = await fetchWithTimeout('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'LinkedInAuthority' },
    });
    if (!profileResponse.ok) return res.status(400).json({ error: 'GitHub credential was rejected.' });
    const profile = await profileResponse.json() as Record<string, unknown>;
    await saveGithubCredential(req.user.uid, token, profile);
    invalidateGithubListCache(req.user.uid);
    void recordProductEvent(req.user.uid, 'github_connected');
    return res.json({ connected: true, profile: { login: profile.login, avatar_url: profile.avatar_url, name: profile.name } });
  } catch (error) {
    console.error('GitHub credential connection failed:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'GitHub connection is temporarily unavailable.' });
  }
});

router.patch('/github/scope', async (req: any, res) => {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  const scope = req.body?.scope;
  if (scope !== 'public' && scope !== 'all') {
    return res.status(400).json({ error: 'A valid GitHub access scope is required.' });
  }
  try {
    await setGithubAccessScope(req.user.uid, scope);
    invalidateGithubListCache(req.user.uid);
    return res.json({ githubPermissions: scope });
  } catch {
    return res.status(503).json({ error: 'GitHub access scope is temporarily unavailable.' });
  }
});

router.delete('/github', async (req: any, res) => {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await deleteGithubCredential(req.user.uid);
    invalidateGithubListCache(req.user.uid);
    void recordProductEvent(req.user.uid, 'github_disconnected');
    return res.json({ connected: false });
  } catch {
    return res.status(503).json({ error: 'GitHub disconnect is temporarily unavailable.' });
  }
});

async function githubJson(path: string, token?: string) {
  const response = await fetchWithTimeout(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'LinkedInAuthority',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub request failed: ${response.status}`);
  return response.json();
}

router.get('/github/repos', async (req: any, res) => {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = await getGithubCredentialForUser(req.user.uid);
    const username = typeof req.query.username === 'string' ? req.query.username : '';
    const scope = token ? 'private-opt-in' : 'public-only';
    const data = await cachedGithubValue(githubListCache, `${req.user.uid}:repos:${scope}:${username.toLowerCase()}`, () => token
      ? githubJson('/user/repos?per_page=100&sort=updated', token)
      : githubJson(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`), GITHUB_LIST_CACHE_TTL_MS);
    return res.json({ repos: data });
  } catch (error) {
    if (error instanceof GithubCredentialUnavailableError) {
      return res.status(503).json({ error: 'Private GitHub access is unavailable. Reconnect GitHub or use public repositories.' });
    }
    return res.status(502).json({ error: 'Unable to load GitHub repositories.' });
  }
});

router.get('/github/repository/:owner/:repo', async (req: any, res) => {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  const owner = typeof req.params.owner === 'string' ? req.params.owner.trim() : '';
  const repo = typeof req.params.repo === 'string' ? req.params.repo.trim() : '';
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo)) {
    return res.status(400).json({ error: 'A valid GitHub repository is required.' });
  }

  try {
    const token = await getGithubCredentialForUser(req.user.uid);
    const scope = token ? 'private-opt-in' : 'public-only';
    const cacheKey = `${req.user.uid}:repository:${scope}:${owner.toLowerCase()}/${repo.toLowerCase()}`;
    const payload = await cachedGithubValue(githubRepositoryCache, cacheKey, async () => {
      const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const [repoMeta, commits, branches, contents, readme] = await Promise.all([
        githubJson(base, token),
        githubJson(`${base}/commits?per_page=5`, token),
        githubJson(`${base}/branches`, token),
        githubJson(`${base}/contents`, token),
        githubJson(`${base}/readme`, token),
      ]);
      return { repoMeta, commits, branches, contents, readme, scope };
    }, GITHUB_REPOSITORY_CACHE_TTL_MS);
    return res.json(payload);
  } catch (error) {
    if (error instanceof GithubCredentialUnavailableError) {
      return res.status(503).json({ error: 'Private GitHub access is unavailable. Reconnect GitHub or use public repositories.' });
    }
    return res.status(502).json({ error: 'Unable to load GitHub repository details.' });
  }
});

router.get('/github/orgs', async (req: any, res) => {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = await getGithubCredentialForUser(req.user.uid);
    const username = typeof req.query.username === 'string' ? req.query.username : '';
    const scope = token ? 'private-opt-in' : 'public-only';
    const data = await cachedGithubValue(githubListCache, `${req.user.uid}:orgs:${scope}:${username.toLowerCase()}`, () => token
      ? githubJson('/user/orgs?per_page=100', token)
      : githubJson(`/users/${encodeURIComponent(username)}/orgs?per_page=100`), GITHUB_LIST_CACHE_TTL_MS);
    return res.json({ orgs: data });
  } catch (error) {
    if (error instanceof GithubCredentialUnavailableError) {
      return res.status(503).json({ error: 'Private GitHub access is unavailable. Reconnect GitHub or use public repositories.' });
    }
    return res.status(502).json({ error: 'Unable to load GitHub organizations.' });
  }
});

export default router;
