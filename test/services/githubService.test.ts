import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRateLimit, checkTokenScopes, fetchReadme } from '../../src/services/githubService';

// Mock fetch globally
global.fetch = vi.fn();

describe('githubService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });



  describe('fetchRateLimit', () => {
    it('should return rate limit info when API responds with 200', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: {
            core: {
              limit: 5000,
              remaining: 4999,
              reset: 1600000000
            }
          }
        }),
        headers: new Headers()
      });

      const result = await fetchRateLimit('valid-token');
      expect(result).toEqual({ limit: 5000, remaining: 4999, reset: 1600000000 });
      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/rate_limit', expect.any(Object));
    });

    it('should return null when API request fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchRateLimit();
      expect(result).toBeNull();
    });
  });

  describe('checkTokenScopes', () => {
    it('should return invalid if no token provided', async () => {
      const result = await checkTokenScopes('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No token provided');
    });

    it('should identify repo scope correctly', async () => {
      const headers = new Headers();
      headers.set('X-OAuth-Scopes', 'repo, read:user');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ login: 'testuser' }),
        headers
      });

      const result = await checkTokenScopes('valid-token');
      expect(result.valid).toBe(true);
      expect(result.hasRepoScope).toBe(true);
      expect(result.scopes).toContain('repo');
    });
  });

  describe('fetchReadme', () => {
    it('should return fallback README string on fetch failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      const readme = await fetchReadme('testuser', 'testrepo', undefined, true);
      expect(readme).toContain('No online README.md could be retrieved');
      expect(readme).toContain('testrepo');
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
