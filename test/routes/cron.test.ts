import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mocks for deep scan, activity delta checker, and gemini generator
const mockPerformDeepScan = vi.fn();
const mockCheckRepositoryActivityDelta = vi.fn();
const mockGenerateDeepPost = vi.fn();

vi.mock('../../server/services/deepIntelligence', () => ({
  performDeepScan: (...args: any[]) => mockPerformDeepScan(...args),
  checkRepositoryActivityDelta: (...args: any[]) => mockCheckRepositoryActivityDelta(...args),
  generateDeepPost: (...args: any[]) => mockGenerateDeepPost(...args),
  fetchLatestCommit: vi.fn()
}));

vi.mock('../../server/services/deepIntelligence/deepPostGenerator', () => ({
  generateDeepPost: (...args: any[]) => mockGenerateDeepPost(...args)
}));

vi.mock('../../server/services/entitlements', () => ({
  getUserTier: vi.fn().mockResolvedValue('free'),
  getAutomationProjectLimit: vi.fn().mockReturnValue(2)
}));

vi.mock('../../server/services/usageLedger', () => ({
  consumeAiCapability: vi.fn().mockResolvedValue(true)
}));

// These automation fixtures represent public repositories. Keep credential
// storage out of this route unit test; private-access failure behavior is
// covered by githubCredentials/integrations tests.
vi.mock('../../server/services/githubCredentials', () => ({
  getGithubCredentialForUser: vi.fn().mockResolvedValue(undefined),
}));

// Mock Firestore Admin
const mockDraftsAdd = vi.fn().mockResolvedValue({ id: 'new-draft-123' });
const mockProjectUpdate = vi.fn().mockResolvedValue({});
const mockProjectsGet = vi.fn();
const mockSettingsGet = vi.fn();
const mockUsersGet = vi.fn();

vi.mock('../../server/services/firestoreAdmin', () => ({
  getFirestoreDatabaseId: vi.fn().mockReturnValue('ai-studio-linkedincontentg-ccdbb9f2-7653-4a9f-bb1d-558a296caa4e'),
  getAdminFirestore: vi.fn().mockReturnValue({
    collection: vi.fn((collName: string) => {
      if (collName === 'users') {
        return {
          get: mockUsersGet,
          doc: vi.fn((userId: string) => ({
            collection: vi.fn((subColl: string) => {
              if (subColl === 'drafts') {
                return { add: mockDraftsAdd };
              }
              if (subColl === 'projects') {
                return { get: mockProjectsGet };
              }
              if (subColl === 'settings') {
                return {
                  doc: vi.fn(() => ({
                    get: mockSettingsGet
                  }))
                };
              }
              return { get: vi.fn().mockResolvedValue({ empty: true, docs: [] }), add: vi.fn() };
            })
          }))
        };
      }
      return { get: vi.fn() };
    })
  })
}));

import cronRouter from '../../server/routes/cron';

const app = express();
app.use(express.json());
app.use('/api/cron', cronRouter);

describe('Scheduled Automation Subsystem Tests', () => {
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const now = new Date();
  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: localTz }).format(now);
  const currentHourNum = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: localTz }).format(now), 10);
  const formattedHour = currentHourNum < 10 ? `0${currentHourNum}:00` : `${currentHourNum}:00`;

  function setupUserProject(projectDataOverrides: Record<string, any> = {}, userSettingsData: Record<string, any> = {}) {
    const { monitoringConfig: overrideConfig, ...otherOverrides } = projectDataOverrides;
    const finalMonitoringConfig = {
      scheduleDay: currentDay,
      scheduleTime: formattedHour,
      timezone: localTz,
      intent: 'weekly_progress',
      targetAudience: 'tech_community',
      contentLanguage: 'en',
      monitorCommits: true,
      monitorIssues: false,
      monitorPullRequests: false,
      ...overrideConfig
    };

    mockUsersGet.mockResolvedValueOnce({
      size: 1,
      empty: false,
      docs: [
        {
          id: 'user-abc',
          ref: {
            collection: vi.fn((sub: string) => {
              if (sub === 'projects') {
                return {
                  get: vi.fn().mockResolvedValue({
                    size: 1,
                    empty: false,
                    docs: [
                      {
                        id: 'testowner_testrepo',
                        ref: { update: mockProjectUpdate },
                        data: () => ({
                          fullName: 'testowner/testrepo',
                          owner: 'testowner',
                          repo: 'testrepo',
                          monitoringEnabled: true,
                          ...otherOverrides,
                          monitoringConfig: finalMonitoringConfig
                        })
                      }
                    ]
                  })
                };
              }
              if (sub === 'settings') {
                return {
                  doc: vi.fn(() => ({
                    get: vi.fn().mockResolvedValue({
                      exists: true,
                      data: () => userSettingsData
                    })
                  }))
                };
              }
              return { get: vi.fn() };
            })
          }
        }
      ]
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';

    mockPerformDeepScan.mockResolvedValue({
      githubContext: {
        owner: 'testowner',
        repo: 'testrepo',
        repoIdentity: {
          name: 'testrepo',
          description: 'A developer tool for automated keyboard layout fixes',
          readmeText: 'KeyFixer detects mistyped text and corrects layouts.',
          manifestData: '',
          languages: { TypeScript: 100 },
          topics: ['keyboard', 'layout']
        },
        commits: [{ message: 'feat: add auto layout detection', date: '2026-08-18', author: 'Dev' }],
        pullRequests: [],
        issues: []
      },
      synthesizedContext: {
        hasMeaningfulContent: true,
        technicalDecisions: ['Integrated heuristic layout switcher'],
        challengesSolved: ['Fixed UTF-8 character conversion bug'],
        newFeatures: ['Arabic and English layout auto-switch'],
        summary: 'Added robust keyboard layout correction.'
      }
    });

    mockGenerateDeepPost.mockResolvedValue({
      post: '🚀 Automated Update: Fixed keyboard layout switching heuristics.',
      suggestedComment: 'Check out the code: https://github.com/testowner/testrepo'
    });
  });

  it('1. rejects unauthorized cron requests', async () => {
    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer wrong-secret');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized cron request');
  });

  it('rejects cron requests when the secret is not configured', async () => {
    delete process.env.CRON_SECRET;

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Cron service is not configured');
  });

  it('retention cleanup is protected by the cron secret', async () => {
    const res = await request(app)
      .post('/api/cron/retention')
      .set('Authorization', 'Bearer wrong-secret');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized cron request');
  });

  it('retention cleanup rejects requests when the secret is not configured', async () => {
    delete process.env.CRON_SECRET;

    const res = await request(app)
      .post('/api/cron/retention')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Cron service is not configured');
  });

  it('2. no new enabled-source activity => zero AI calls', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: false,
      reasons: []
    });

    setupUserProject();

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(0);
    expect(mockCheckRepositoryActivityDelta).toHaveBeenCalledTimes(1);
    expect(mockPerformDeepScan).not.toHaveBeenCalled();
    expect(mockGenerateDeepPost).not.toHaveBeenCalled();
  });

  it('3. commits disabled => commits do not trigger delta or generation', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: false,
      reasons: []
    });

    setupUserProject({
      monitoringConfig: {
        monitorCommits: false,
        monitorIssues: true,
        monitorPullRequests: false
      }
    });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(mockCheckRepositoryActivityDelta).toHaveBeenCalledWith(
      'testowner/testrepo',
      expect.objectContaining({ monitorCommits: false, monitorIssues: true, monitorPullRequests: false }),
      expect.anything(),
      undefined
    );
    expect(mockPerformDeepScan).not.toHaveBeenCalled();
  });

  it('4. issue-only automation triggers when new issue is updated', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestIssueUpdatedAt: '2026-08-18T01:00:00Z',
      reasons: ['Updated Issue: #12 (Fix layout race condition)']
    });

    setupUserProject({
      monitoringConfig: {
        monitorCommits: false,
        monitorIssues: true,
        monitorPullRequests: false
      }
    });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(1);
    expect(mockPerformDeepScan).toHaveBeenCalledTimes(1);
    expect(mockDraftsAdd).toHaveBeenCalledTimes(1);
  });

  it('5. PR-only automation triggers when new PR is merged', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestPrUpdatedAt: '2026-08-18T01:30:00Z',
      reasons: ['Merged PR: #5 (Add Wayland protocol support)']
    });

    setupUserProject({
      monitoringConfig: {
        monitorCommits: false,
        monitorIssues: false,
        monitorPullRequests: true
      }
    });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(1);
    expect(mockPerformDeepScan).toHaveBeenCalledTimes(1);
    expect(mockDraftsAdd).toHaveBeenCalledTimes(1);
  });

  it('6. contentLanguage=en generates English regardless of Arabic UI settings', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestCommit: { sha: 'sha_123', date: '2026-08-18', message: 'feat: add key mapping' },
      reasons: ['New commit']
    });

    setupUserProject(
      { monitoringConfig: { contentLanguage: 'en' } },
      { language: 'ar' } // UI language is Arabic in settings
    );

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(mockGenerateDeepPost).toHaveBeenCalledWith(
      expect.anything(),
      'https://github.com/testowner/testrepo',
      'en',
      expect.anything(),
      'free'
    );
  });

  it('7. contentLanguage=ar generates Arabic regardless of English UI settings', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestCommit: { sha: 'sha_123', date: '2026-08-18', message: 'feat: add key mapping' },
      reasons: ['New commit']
    });

    setupUserProject(
      { monitoringConfig: { contentLanguage: 'ar' } },
      { language: 'en' } // UI language is English in settings
    );

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(mockGenerateDeepPost).toHaveBeenCalledWith(
      expect.anything(),
      'https://github.com/testowner/testrepo',
      'ar',
      expect.anything(),
      'free'
    );
  });

  it('8. weekly_progress vs technical_deep_dive follow different intent paths and targetAudience is passed', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestCommit: { sha: 'sha_456', date: '2026-08-18', message: 'feat: architectural refactor' },
      reasons: ['New commit']
    });

    setupUserProject({
      monitoringConfig: {
        intent: 'technical_deep_dive',
        targetAudience: 'recruiters'
      }
    });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(mockGenerateDeepPost).toHaveBeenCalledWith(
      expect.anything(),
      'https://github.com/testowner/testrepo',
      'en',
      expect.objectContaining({
        intent: 'technical_deep_dive',
        targetAudience: 'recruiters'
      }),
      'free'
    );
  });

  it('9. insufficient evidence (hasMeaningfulContent=false) => no draft created', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestCommit: { sha: 'sha_trivial', date: '2026-08-18', message: 'chore: bump patch version' },
      reasons: ['Trivial edit']
    });

    mockPerformDeepScan.mockResolvedValueOnce({
      githubContext: {
        owner: 'testowner',
        repo: 'testrepo',
        repoIdentity: { name: 'testrepo', description: '' },
        commits: [],
        pullRequests: [],
        issues: []
      },
      synthesizedContext: {
        hasMeaningfulContent: false,
        technicalDecisions: [],
        challengesSolved: [],
        newFeatures: [],
        summary: 'Only trivial edits'
      }
    });

    setupUserProject({ lastProcessedCommit: 'old_sha' });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(0);
    expect(mockGenerateDeepPost).not.toHaveBeenCalled();
    expect(mockDraftsAdd).not.toHaveBeenCalled();
    const observedUpdate = mockProjectUpdate.mock.calls.find((call: any[]) => call[0]?.lastObservedActivity);
    expect(observedUpdate?.[0]).toEqual(expect.objectContaining({
      lastObservedActivity: expect.objectContaining({ commitSha: 'sha_trivial' }),
    }));
    expect(observedUpdate?.[0]?.lastContentGeneratedFrom).toBeUndefined();
  });

  it('10. successful generation => checkpoint updated and lease released', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestCommit: { sha: 'sha_new_commit', date: '2026-08-18', message: 'feat: new feature' },
      reasons: ['New commit']
    });

    setupUserProject({ lastProcessedCommit: 'old_sha' });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(1);
    expect(mockDraftsAdd).toHaveBeenCalledTimes(1);
    expect(mockPerformDeepScan).toHaveBeenCalledWith(
      'https://github.com/testowner/testrepo',
      undefined,
      expect.anything(),
      'free',
      expect.objectContaining({ analyzedCommitSha: 'old_sha', defaultBranch: 'main' }),
      expect.anything(),
    );
    expect(mockProjectUpdate).toHaveBeenCalledWith(expect.objectContaining({
      lastProcessedCommit: 'sha_new_commit',
      lastProcessed: expect.objectContaining({ commitSha: 'sha_new_commit' }),
      lastObservedActivity: expect.objectContaining({ commitSha: 'sha_new_commit' }),
      lastContentGeneratedFrom: expect.objectContaining({ commitSha: 'sha_new_commit' }),
      processingLease: null
    }));
  });

  it('11. Gemini failure => checkpoint unchanged and lease released', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestCommit: { sha: 'sha_fail', date: '2026-08-18', message: 'feat: big feature' },
      reasons: ['New commit']
    });

    mockGenerateDeepPost.mockRejectedValueOnce(new Error('Gemini quota exceeded'));

    setupUserProject({ lastProcessedCommit: 'old_sha' });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(0);
    expect(mockDraftsAdd).not.toHaveBeenCalled();
    // Checkpoint must NOT be updated with new sha
    expect(mockProjectUpdate).not.toHaveBeenCalledWith(expect.objectContaining({
      lastProcessedCommit: 'sha_fail'
    }));
    // Lease must be cleaned up
    expect(mockProjectUpdate).toHaveBeenCalledWith(expect.objectContaining({
      processingLease: null
    }));
  });

  it('12. active lease prevents concurrent duplicate execution', async () => {
    const futureExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    setupUserProject({
      processingLease: {
        lockedAt: new Date().toISOString(),
        expiresAt: futureExpiry
      }
    });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(0);
    expect(mockCheckRepositoryActivityDelta).not.toHaveBeenCalled();
    expect(mockPerformDeepScan).not.toHaveBeenCalled();
  });

  it('13. KeyFixer regression: grounded repository identity is passed to post generator', async () => {
    mockCheckRepositoryActivityDelta.mockResolvedValueOnce({
      hasNewActivity: true,
      latestCommit: { sha: 'sha_keyfixer', date: '2026-08-18', message: 'feat: fix keyboard shortcut' },
      reasons: ['New commit']
    });

    mockPerformDeepScan.mockResolvedValueOnce({
      githubContext: {
        owner: 'obadadallo',
        repo: 'KeyFixer',
        repoIdentity: {
          name: 'KeyFixer',
          description: 'A desktop keyboard layout auto-fixer and language switcher tool',
          readmeText: 'KeyFixer automatically detects mistyped text in the wrong keyboard layout.',
          manifestData: '',
          languages: { Rust: 100 },
          topics: ['keyboard', 'layout-switcher']
        },
        commits: [{ message: 'feat: fix shortcut handling', date: '2026-08-18', author: 'obadadallo' }],
        pullRequests: [],
        issues: []
      },
      synthesizedContext: {
        hasMeaningfulContent: true,
        technicalDecisions: ['Direct OS hook integration'],
        challengesSolved: ['Race conditions in global keyboard hooks'],
        newFeatures: ['Instant text layout correction without clipboard contamination'],
        summary: 'Enhanced global keyboard layout switching performance.'
      }
    });

    setupUserProject({
      fullName: 'obadadallo/KeyFixer',
      owner: 'obadadallo',
      repo: 'KeyFixer',
      monitoringConfig: {
        intent: 'technical_deep_dive',
        targetAudience: 'tech_community',
        contentLanguage: 'en'
      }
    });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(1);
    expect(mockGenerateDeepPost).toHaveBeenCalledWith(
      expect.anything(),
      'https://github.com/obadadallo/KeyFixer',
      'en',
      expect.objectContaining({
        repoIdentity: expect.objectContaining({
          name: 'KeyFixer',
          description: 'A desktop keyboard layout auto-fixer and language switcher tool'
        })
      }),
      'free'
    );
  });
});
