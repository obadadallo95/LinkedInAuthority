import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mocks for deep scan and gemini generator
const mockPerformDeepScan = vi.fn();
const mockFetchLatestCommit = vi.fn();
const mockGenerateDeepPost = vi.fn();

vi.mock('../../server/services/deepIntelligence', () => ({
  performDeepScan: (...args: any[]) => mockPerformDeepScan(...args),
  fetchLatestCommit: (...args: any[]) => mockFetchLatestCommit(...args)
}));

vi.mock('../../server/services/deepIntelligence/deepPostGenerator', () => ({
  generateDeepPost: (...args: any[]) => mockGenerateDeepPost(...args)
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
                  doc: vi.fn((docId: string) => ({
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

describe('Cron Route - Minimal AI/API Cost Optimization & Persistence', () => {
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = new Date().getHours();
  const formattedHour = currentHour < 10 ? `0${currentHour}:00` : `${currentHour}:00`;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';

    mockPerformDeepScan.mockResolvedValue({
      githubContext: { owner: 'testowner', repo: 'testrepo' },
      synthesizedContext: {
        technicalDecisions: ['Adopted TypeScript strictly'],
        challengesSolved: ['Resolved async deadlock'],
        newFeatures: ['Added cron automation'],
        summary: 'High momentum sprint'
      }
    });

    mockGenerateDeepPost.mockResolvedValue({
      post: '🚀 Automated Weekly Update: Refactored engine architecture.',
      suggestedComment: 'Check out the code: https://github.com/testowner/testrepo'
    });
  });

  it('rejects unauthorized cron requests', async () => {
    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer wrong-secret');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized cron request');
  });

  it('only processes repositories with monitoringEnabled=true', async () => {
    mockUsersGet.mockResolvedValueOnce({
      size: 1,
      empty: false,
      docs: [
        {
          id: 'user-disabled',
          ref: {
            collection: vi.fn((sub: string) => {
              if (sub === 'projects') {
                return {
                  get: vi.fn().mockResolvedValue({
                    size: 1,
                    empty: false,
                    docs: [
                      {
                        id: 'disabled_repo',
                        ref: { update: mockProjectUpdate },
                        data: () => ({
                          fullName: 'testowner/disabledrepo',
                          owner: 'testowner',
                          repo: 'disabledrepo',
                          monitoringEnabled: false,
                          monitoringConfig: {
                            scheduleDay: currentDay,
                            scheduleTime: formattedHour
                          }
                        })
                      }
                    ]
                  })
                };
              }
              return { get: vi.fn() };
            })
          }
        }
      ]
    });

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(0);
    expect(mockFetchLatestCommit).not.toHaveBeenCalled();
    expect(mockPerformDeepScan).not.toHaveBeenCalled();
    expect(mockGenerateDeepPost).not.toHaveBeenCalled();
  });

  it('stops without calling deep scan or Gemini when no new commits exist (null commit)', async () => {
    mockFetchLatestCommit.mockResolvedValueOnce(null);

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
                          monitoringConfig: {
                            scheduleDay: currentDay,
                            scheduleTime: formattedHour
                          }
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
                      data: () => ({ language: 'en' })
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

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(0);
    expect(mockFetchLatestCommit).toHaveBeenCalledTimes(1);
    expect(mockPerformDeepScan).not.toHaveBeenCalled();
    expect(mockGenerateDeepPost).not.toHaveBeenCalled();
    expect(mockDraftsAdd).not.toHaveBeenCalled();
    expect(mockProjectUpdate).not.toHaveBeenCalled();
  });

  it('stops without calling deep scan or Gemini when commit matches lastProcessedCommit (same commit range)', async () => {
    mockFetchLatestCommit.mockResolvedValueOnce({
      sha: 'c8b31e2abcdef1234567890abcdef1234567890',
      date: '2026-08-17T20:00:00Z',
      message: 'fix: already processed commit'
    });

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
                          lastProcessedCommit: 'c8b31e2abcdef1234567890abcdef1234567890',
                          lastProcessedAt: '2026-08-17T20:05:00Z',
                          monitoringConfig: {
                            scheduleDay: currentDay,
                            scheduleTime: formattedHour
                          }
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
                      data: () => ({ language: 'en' })
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

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(0);
    expect(mockFetchLatestCommit).toHaveBeenCalledTimes(1);
    expect(mockPerformDeepScan).not.toHaveBeenCalled();
    expect(mockGenerateDeepPost).not.toHaveBeenCalled();
    expect(mockDraftsAdd).not.toHaveBeenCalled();
    expect(mockProjectUpdate).not.toHaveBeenCalled();
  });

  it('triggers exactly one generation and updates the checkpoint when new meaningful activity exists', async () => {
    const newCommitSha = 'a61900f9876543210fedcba9876543210fedcba9';
    mockFetchLatestCommit.mockResolvedValueOnce({
      sha: newCommitSha,
      date: '2026-08-17T22:00:00Z',
      message: 'feat: brand new feature'
    });

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
                          lastProcessedCommit: 'c8b31e2_old_sha',
                          monitoringConfig: {
                            scheduleDay: currentDay,
                            scheduleTime: formattedHour,
                            intent: 'weekly_progress'
                          }
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
                      data: () => ({
                        githubToken: 'ghp_fake_token_123',
                        language: 'en'
                      })
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

    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer test-secret');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.processed).toBe(1);

    // Exactly one deep scan and Gemini generation
    expect(mockPerformDeepScan).toHaveBeenCalledTimes(1);
    expect(mockGenerateDeepPost).toHaveBeenCalledTimes(1);

    // Verify draft was saved to users/{uid}/drafts with DraftsDashboard schema
    expect(mockDraftsAdd).toHaveBeenCalledTimes(1);
    const savedDraft = mockDraftsAdd.mock.calls[0][0];

    expect(savedDraft).toMatchObject({
      projectId: 'testowner_testrepo',
      type: 'repo_analysis',
      title: 'Weekly Automation: testowner/testrepo',
      status: 'draft',
      isAutomated: true
    });

    const parsedContent = JSON.parse(savedDraft.content);
    expect(parsedContent.post).toBe('🚀 Automated Weekly Update: Refactored engine architecture.');
    expect(parsedContent.suggestedComment).toBe('Check out the code: https://github.com/testowner/testrepo');

    // Verify successful generation updates the checkpoint on the project document
    expect(mockProjectUpdate).toHaveBeenCalledTimes(1);
    expect(mockProjectUpdate).toHaveBeenCalledWith({
      lastProcessedCommit: newCommitSha,
      lastProcessedAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });
});

