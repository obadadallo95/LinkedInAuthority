import { beforeEach, describe, expect, it, vi } from 'vitest';

const transaction = {
  get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ events: { post_generated: 1 } }) }),
  set: vi.fn(),
};
const runTransaction = vi.fn(async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction));
const dayRef = { path: 'users/u1/productMetrics/2026-09-21' };

vi.mock('../../server/services/firestoreAdmin', () => ({
  getAdminFirestore: vi.fn(() => ({
    runTransaction,
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({ doc: vi.fn(() => dayRef) })),
      })),
    })),
  })),
}));

import { recordProductEvent } from '../../server/services/productTelemetry';

describe('product telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PRODUCT_TELEMETRY_ENABLED = 'true';
    transaction.get.mockResolvedValue({ exists: true, data: () => ({ events: { post_generated: 1 } }) });
  });

  it('stores only aggregate counters and allowlisted properties', async () => {
    await recordProductEvent('u1', 'draft_edited', {
      characterCount: 250,
      source: 'manual',
      postText: 'must never be stored',
      repositoryUrl: 'https://github.com/private/repo',
    });

    expect(runTransaction).toHaveBeenCalledTimes(1);
    const payload = transaction.set.mock.calls[0][1];
    expect(payload.events).toEqual({ post_generated: 1, draft_edited: 1 });
    expect(payload.lastProperties.draft_edited).toEqual({ characterCount: 250, source: 'manual' });
    expect(JSON.stringify(payload)).not.toContain('must never be stored');
    expect(JSON.stringify(payload)).not.toContain('github.com/private');
  });

  it('does not write when telemetry is disabled', async () => {
    process.env.PRODUCT_TELEMETRY_ENABLED = 'false';
    await recordProductEvent('u1', 'post_generated');
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('records durable funnel milestones without storing content', async () => {
    transaction.get
      .mockResolvedValueOnce({ exists: false, data: () => ({}) })
      .mockResolvedValueOnce({ exists: false, data: () => ({}) });

    await recordProductEvent('u1', 'post_generated', {
      postText: 'private content must never be stored',
      repositoryUrl: 'https://github.com/private/repo',
    });

    expect(transaction.set).toHaveBeenCalledTimes(2);
    const summaryPayload = transaction.set.mock.calls[1][1];
    expect(summaryPayload.events).toEqual({ post_generated: 1 });
    expect(summaryPayload.milestones.firstPostGeneratedAt).toBeTruthy();
    expect(JSON.stringify(summaryPayload)).not.toContain('private content');
    expect(JSON.stringify(summaryPayload)).not.toContain('github.com/private');
  });

  it('does not write anonymous events', async () => {
    await recordProductEvent(undefined, 'post_generated');
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
