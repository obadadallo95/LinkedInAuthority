import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addConnectionLog, getConnectionLogs, subscribeToLogs } from '../../src/services/githubService';

describe('browser GitHub integration boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps connection logs local and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToLogs(listener);

    addConnectionLog('GitHub connection', 'info', 'Server-backed integration requested');

    expect(listener).toHaveBeenCalledOnce();
    expect(getConnectionLogs()[0]).toMatchObject({
      action: 'GitHub connection',
      status: 'info',
      message: 'Server-backed integration requested',
    });

    unsubscribe();
    addConnectionLog('GitHub connection', 'success', 'Server-backed integration completed');
    expect(listener).toHaveBeenCalledOnce();
  });
});
