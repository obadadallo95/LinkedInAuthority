import { describe, expect, it } from 'vitest';
import {
  isExpiredOperationalRecord,
  retentionCutoff,
  RETENTION_DAYS,
} from '../../server/services/retentionPolicy';

const now = new Date('2026-09-21T12:00:00.000Z');

describe('retention policy', () => {
  it('uses resource-specific UTC cutoffs', () => {
    expect(retentionCutoff('automationRuns', now).toISOString()).toBe('2026-06-23T12:00:00.000Z');
    expect(RETENTION_DAYS.repositorySnapshotVersions).toBe(30);
  });

  it('expires old operational records and keeps recent records', () => {
    expect(isExpiredOperationalRecord('automationRuns', { finishedAt: '2026-06-22T23:59:59.000Z' }, now)).toBe(true);
    expect(isExpiredOperationalRecord('automationRuns', { finishedAt: '2026-06-23T12:00:00.000Z' }, now)).toBe(false);
  });

  it('uses usage ledger document dates when no timestamp field exists', () => {
    expect(isExpiredOperationalRecord('usageLedger', {}, now, '2026-06-22')).toBe(true);
    expect(isExpiredOperationalRecord('usageLedger', {}, now, '2026-06-23')).toBe(false);
  });

  it('expires aggregate product telemetry after its declared window', () => {
    expect(isExpiredOperationalRecord('productMetrics', { updatedAt: '2026-03-24T00:00:00.000Z' }, now)).toBe(true);
    expect(isExpiredOperationalRecord('productMetrics', { updatedAt: '2026-03-26T00:00:00.000Z' }, now)).toBe(false);
  });

  it('retains records with missing or invalid timestamps', () => {
    expect(isExpiredOperationalRecord('automationRuns', {}, now)).toBe(false);
    expect(isExpiredOperationalRecord('automationRuns', { updatedAt: 'not-a-date' }, now)).toBe(false);
  });
});
