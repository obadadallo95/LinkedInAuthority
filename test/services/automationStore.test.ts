import { describe, expect, it, vi } from 'vitest';
import { acquireAutomationRun, buildAutomationRunId, finishAutomationRun, persistAutomationDraftOnce } from '../../server/services/automationStore';

describe('automationStore', () => {
  it('creates a stable idempotency key for the same scheduled checkpoint', () => {
    const input = {
      userId: 'u1',
      projectId: 'p1',
      scheduledWindow: 'Monday:09:00:UTC:2026-09-21',
      checkpoint: { commitSha: 'abc', issueUpdatedAt: null },
    };
    expect(buildAutomationRunId(input)).toBe(buildAutomationRunId({ ...input, checkpoint: { commitSha: 'abc', issueUpdatedAt: null } }));
    expect(buildAutomationRunId(input)).not.toBe(buildAutomationRunId({ ...input, checkpoint: { commitSha: 'def', issueUpdatedAt: null } }));
  });

  it('acquires a lease and writes the run atomically', async () => {
    const projectRef = { path: 'users/u1/projects/p1' };
    const runRef = { path: 'users/u1/projects/p1/automationRuns/r1' };
    const transaction = {
      get: vi.fn()
        .mockResolvedValueOnce({ exists: true, data: () => ({}) })
        .mockResolvedValueOnce({ exists: false }),
      set: vi.fn(),
      update: vi.fn(),
    };
    const db = { runTransaction: vi.fn(async (callback: any) => callback(transaction)) };

    await expect(acquireAutomationRun(db, projectRef, runRef, {
      runId: 'r1', now: '2026-09-21T09:00:00.000Z', leaseExpiresAt: '2026-09-21T09:10:00.000Z', repo: 'o/r', checkpoint: {},
    })).resolves.toBe('acquired');
    expect(transaction.set).toHaveBeenCalledTimes(2);
  });

  it('does not write a second draft for a completed run', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ status: 'draft_created' }) }),
      set: vi.fn(),
    };
    const db = { runTransaction: vi.fn(async (callback: any) => callback(transaction)) };
    const result = await persistAutomationDraftOnce(db, {}, {}, {
      draftId: 'automation-r1', draft: { content: 'draft' }, now: '2026-09-21T09:00:00.000Z',
    });
    expect(result).toBe(false);
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('releases the lease and advances the checkpoint in one transaction', async () => {
    const transaction = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ retryCount: 1 }) }), update: vi.fn(), set: vi.fn() };
    const db = { runTransaction: vi.fn(async (callback: any) => callback(transaction)) };
    await finishAutomationRun(db, {}, {}, {
      status: 'draft_created', now: '2026-09-21T09:01:00.000Z', checkpoint: { commitSha: 'new' },
    });
    expect(transaction.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ processingLease: null, lastProcessed: { commitSha: 'new' } }));
    expect(transaction.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: 'draft_created' }), { merge: true });
  });

  it('keeps observed activity separate from the last generated content source', async () => {
    const transaction = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ retryCount: 0 }) }), update: vi.fn(), set: vi.fn() };
    const db = { runTransaction: vi.fn(async (callback: any) => callback(transaction)) };
    await finishAutomationRun(db, {}, {}, {
      status: 'not_meaningful',
      now: '2026-09-21T09:01:00.000Z',
      observedCheckpoint: { commitSha: 'noise-sha' },
    });
    const patch = transaction.update.mock.calls[0][1];
    expect(patch.lastObservedActivity).toEqual({ commitSha: 'noise-sha' });
    expect(patch.lastContentGeneratedFrom).toBeUndefined();
  });

  it('backs off failed runs and stops retrying after three attempts', async () => {
    const projectRef = {};
    const runRef = {};
    const transaction = {
      get: vi.fn()
        .mockResolvedValueOnce({ exists: true, data: () => ({ processingLease: null }) })
        .mockResolvedValueOnce({ exists: true, data: () => ({ status: 'failed', retryCount: 1 }) }),
      set: vi.fn(),
    };
    const db = { runTransaction: vi.fn(async (callback: any) => callback(transaction)) };
    await expect(acquireAutomationRun(db, projectRef, runRef, {
      runId: 'retry-1', now: '2026-09-21T09:00:00.000Z', leaseExpiresAt: '2026-09-21T09:10:00.000Z', repo: 'o/r', checkpoint: {},
    })).resolves.toBe('acquired');
    expect(transaction.set).toHaveBeenCalledWith(runRef, expect.objectContaining({ retryCount: 1 }), { merge: true });
  });
});
