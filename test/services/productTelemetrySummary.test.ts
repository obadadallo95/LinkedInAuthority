import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAdminFirestore, usersGet } = vi.hoisted(() => ({
  getAdminFirestore: vi.fn(),
  usersGet: vi.fn(),
}));

vi.mock('../../server/services/firestoreAdmin', () => ({ getAdminFirestore }));

import { getProductTelemetrySummary } from '../../server/services/productTelemetry';

describe('product telemetry summary aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminFirestore.mockReturnValue({
      collection: vi.fn(() => ({
        limit: vi.fn(() => ({ get: usersGet })),
      })),
    });
  });

  it('aggregates only content-free user summaries and enforces the read cap', async () => {
    usersGet.mockResolvedValue({
      docs: [
        {
          ref: {
            collection: vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({
                    events: { post_generated: 2, draft_copied: 1 },
                    milestones: { firstPostGeneratedAt: '2026-09-20T00:00:00.000Z', firstDraftCopiedAt: '2026-09-20T00:01:00.000Z' },
                    postText: 'must never be returned',
                  }),
                }),
              })),
            })),
          },
        },
        {
          ref: {
            collection: vi.fn(() => ({
              doc: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({
                    events: { post_generated: 1, automation_draft_generated: 1 },
                    milestones: { secondPostGeneratedAt: '2026-09-21T00:00:00.000Z', firstAutomationDraftAt: '2026-09-21T00:02:00.000Z' },
                    repositoryUrl: 'https://github.com/private/repo',
                  }),
                }),
              })),
            })),
          },
        },
      ],
    });

    const result = await getProductTelemetrySummary(999);

    expect(usersGet).toHaveBeenCalledTimes(1);
    expect((getAdminFirestore.mock.results[0].value.collection as any).mock.results[0].value.limit).toHaveBeenCalledWith(200);
    expect(result.usersScanned).toBe(2);
    expect(result.activeUsers).toBe(2);
    expect(result.eventTotals).toEqual({ post_generated: 3, draft_copied: 1, automation_draft_generated: 1 });
    expect(result.funnel).toEqual({
      firstPostGeneratedUsers: 1,
      secondPostGeneratedUsers: 1,
      firstDraftCopiedUsers: 1,
      firstAutomationDraftUsers: 1,
    });
    expect(JSON.stringify(result)).not.toContain('must never be returned');
    expect(JSON.stringify(result)).not.toContain('github.com/private');
  });

  it('returns an empty safe report when users have no telemetry summary', async () => {
    usersGet.mockResolvedValue({
      docs: [{ ref: { collection: vi.fn(() => ({ doc: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ exists: false }) })) })) } }],
    });

    const result = await getProductTelemetrySummary(1);

    expect(result.usersScanned).toBe(1);
    expect(result.activeUsers).toBe(0);
    expect(result.eventTotals).toEqual({});
    expect(result.funnel.firstPostGeneratedUsers).toBe(0);
  });
});
