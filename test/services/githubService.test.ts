import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRateLimit, checkTokenScopes, getFallbackRepos, getFallbackReposForOrg, fetchReadme } from '../../src/services/githubService';

// Mock fetch globally
global.fetch = vi.fn();

describe('githubService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getFallbackRepos', () => {
    it('should return a list of mock repos for a given username', () => {
      const repos = getFallbackRepos('testuser');
      expect(repos).toHaveLength(5);
      expect(repos[0].name).toBe('kashef-syrian-post-guard');
      expect(repos[0].isFallback).toBe(true);
    });
  });

  describe('getFallbackReposForOrg', () => {
    it('should return personal repos if orgFilter is "Personal" or empty', () => {
      const repos = getFallbackReposForOrg('testuser', 'Personal');
      expect(repos).toHaveLength(4);
      expect(repos[0].name).toBe('nextjs-enterprise-boilerplate');
    });

    it('should return org specific repos for Google-OpenSource', () => {
      const repos = getFallbackReposForOrg('testuser', 'Google-OpenSource');
      expect(repos).toHaveLength(2);
      expect(repos[0].name).toBe('angular-enterprise-core');
    });
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
    it('should return fallback simulated README if isFallback is true', async () => {
      const readme = await fetchReadme('testuser', 'testrepo', undefined, true);
      expect(readme).toContain('(Local Simulation)');
      expect(readme).toContain('testrepo');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
