import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mocks for deep scan and gemini generator
vi.mock('../../server/services/deepIntelligence', () => ({
  performDeepScan: vi.fn().mockResolvedValue({
    githubContext: { owner: 'testowner', repo: 'testrepo' },
    synthesizedContext: {
      technicalDecisions: ['Adopted TypeScript strictly'],
      challengesSolved: ['Resolved async deadlock'],
      newFeatures: ['Added cron automation'],
      summary: 'High momentum sprint'
    }
  })
}));

vi.mock('../../server/services/deepIntelligence/deepPostGenerator', () => ({
  generateDeepPost: vi.fn().mockResolvedValue({
    post: '🚀 Automated Weekly Update: Refactored engine architecture.',
    suggestedComment: 'Check out the code: https://github.com/testowner/testrepo'
  })
}));

// Mock Firestore Admin
const mockDraftsAdd = vi.fn().mockResolvedValue({ id: 'new-draft-123' });
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

describe('Cron Route - Automated Draft Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  it('rejects unauthorized cron requests', async () => {
    const res = await request(app)
      .post('/api/cron/process-weekly')
      .set('Authorization', 'Bearer wrong-secret');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized cron request');
  });

  it('saves automated generated drafts directly to users/{uid}/drafts in DraftsDashboard format', async () => {
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = new Date().getHours();
    const formattedHour = currentHour < 10 ? `0${currentHour}:00` : `${currentHour}:00`;

    // Mock Users snapshot
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
                        data: () => ({
                          fullName: 'testowner/testrepo',
                          owner: 'testowner',
                          repo: 'testrepo',
                          monitoringEnabled: true,
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

    expect(savedDraft.createdAt).toBeDefined();
    expect(savedDraft.updatedAt).toBeDefined();

    // Verify content is JSON stringified containing post and suggestedComment for DraftsDashboard
    const parsedContent = JSON.parse(savedDraft.content);
    expect(parsedContent.post).toBe('🚀 Automated Weekly Update: Refactored engine architecture.');
    expect(parsedContent.suggestedComment).toBe('Check out the code: https://github.com/testowner/testrepo');
    expect(parsedContent.repository).toEqual({
      owner: 'testowner',
      name: 'testrepo'
    });
  });
});
