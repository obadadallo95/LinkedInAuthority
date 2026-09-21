export type RetentionResource =
  | 'rate_limits'
  | 'usageLedger'
  | 'automationRuns'
  | 'repositorySnapshotVersions'
  | 'productMetrics';

export const RETENTION_DAYS: Record<RetentionResource, number> = {
  // Abuse-control state is useful only while its window is active.
  rate_limits: 2,
  // Usage is kept long enough for support, billing, and quota investigations.
  usageLedger: 90,
  // Run history is operational telemetry, not user-authored content.
  automationRuns: 90,
  // Snapshot versions are used for incremental grounding and are not drafts.
  repositorySnapshotVersions: 30,
  // Product metrics are aggregate operational telemetry, not user content.
  productMetrics: 180,
};

export function retentionCutoff(resource: RetentionResource, now = new Date()): Date {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS[resource]);
  return cutoff;
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Returns whether an operational document is eligible for cleanup. Documents
 * without a trustworthy timestamp are retained, making cleanup fail safe.
 */
export function isExpiredOperationalRecord(
  resource: RetentionResource,
  data: Record<string, unknown> = {},
  now = new Date(),
  documentId?: string,
): boolean {
  const timestamp =
    parseDate(data.updatedAt) ||
    parseDate(data.finishedAt) ||
    parseDate(data.lastIndexedAt) ||
    parseDate(data.createdAt) ||
    (resource === 'usageLedger' && documentId ? parseDate(`${documentId}T23:59:59.999Z`) : undefined);

  return Boolean(timestamp && timestamp < retentionCutoff(resource, now));
}

export const RETENTION_POLICY_SUMMARY = {
  userContent: 'Retained until the user deletes the account; never removed by scheduled cleanup.',
  privateCredentials: 'Excluded from export and scheduled cleanup; removed only through disconnect or account deletion.',
  operationalRecords: 'Expired by resource-specific windows using a fail-safe timestamp check.',
} as const;
