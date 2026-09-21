import { beforeEach, describe, expect, it } from 'vitest';
import { consumeAiCapability, resetMemoryUsageLedgerForTests } from '../../server/services/usageLedger';

describe('atomic AI usage ledger policy', () => {
  beforeEach(() => resetMemoryUsageLedgerForTests());

  it('enforces capability-specific daily request and reserved-cost limits', async () => {
    const user = 'ledger-user';
    for (let i = 0; i < 10; i++) expect(await consumeAiCapability(user, 'hashtags.generate', 'free')).toBe(true);
    expect(await consumeAiCapability(user, 'hashtags.generate', 'free')).toBe(false);
  });

  it('keeps capabilities isolated per user and feature', async () => {
    expect(await consumeAiCapability('user-a', 'repo.analysis', 'free')).toBe(true);
    expect(await consumeAiCapability('user-b', 'repo.analysis', 'free')).toBe(true);
    expect(await consumeAiCapability('user-a', 'hashtags.generate', 'free')).toBe(true);
  });

  it('keeps commit analysis on its own capability budget', async () => {
    const user = 'commit-ledger-user';
    for (let i = 0; i < 10; i++) expect(await consumeAiCapability(user, 'commit.analyze', 'free')).toBe(true);
    expect(await consumeAiCapability(user, 'commit.analyze', 'free')).toBe(false);
    expect(await consumeAiCapability('other-user', 'post.optimize', 'free')).toBe(true);
  });

  it('enforces a unified daily reserved-cost ceiling across capabilities', async () => {
    const user = 'budget-user';
    expect(await consumeAiCapability(user, 'repo.deep_scan', 'free')).toBe(true);
    expect(await consumeAiCapability(user, 'repo.deep_scan', 'free')).toBe(true);
    expect(await consumeAiCapability(user, 'repo.analysis', 'free')).toBe(false);
  });
});
