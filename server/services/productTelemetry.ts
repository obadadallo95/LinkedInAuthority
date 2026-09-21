import { getAdminFirestore } from './firestoreAdmin';

/**
 * Product telemetry is intentionally opt-in. When enabled it stores only
 * daily per-user counters, never post text, repository URLs, prompts, tokens,
 * or provider responses. A small per-user summary stores only funnel
 * milestones, so beta activation and repeat usage can be measured without
 * retaining content.
 */
export type ProductEventName =
  | 'signup_completed'
  | 'github_connected'
  | 'github_disconnected'
  | 'repo_selected'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'meaningful_angle_selected'
  | 'post_generated'
  | 'post_generation_failed'
  | 'hashtags_generated'
  | 'draft_saved'
  | 'draft_edited'
  | 'draft_copied'
  | 'automation_checked'
  | 'automation_draft_generated'
  | 'automation_failed';

export type ProductTelemetrySummary = {
  generatedAt: string;
  usersScanned: number;
  activeUsers: number;
  eventTotals: Partial<Record<ProductEventName, number>>;
  funnel: {
    firstPostGeneratedUsers: number;
    secondPostGeneratedUsers: number;
    firstDraftCopiedUsers: number;
    firstAutomationDraftUsers: number;
  };
};

const SAFE_ENUM_KEYS = new Set(['source', 'language', 'intent', 'mode', 'status']);
const SAFE_NUMBER_KEYS = new Set(['durationMs', 'characterCount', 'editCount']);
const PRODUCT_EVENT_NAMES = new Set<ProductEventName>([
  'signup_completed', 'github_connected', 'github_disconnected', 'repo_selected',
  'analysis_completed', 'analysis_failed', 'meaningful_angle_selected', 'post_generated',
  'post_generation_failed', 'hashtags_generated', 'draft_saved', 'draft_edited',
  'draft_copied', 'automation_checked', 'automation_draft_generated', 'automation_failed',
]);

export function isProductEventName(value: unknown): value is ProductEventName {
  return typeof value === 'string' && PRODUCT_EVENT_NAMES.has(value as ProductEventName);
}

/**
 * Return content-free beta reporting data for an explicitly trusted operator.
 * The hard user cap is intentional: this endpoint is for occasional manual
 * reporting, not a polling dashboard that could create an unbounded read bill.
 */
export async function getProductTelemetrySummary(maxUsers = 100): Promise<ProductTelemetrySummary> {
  const boundedMaxUsers = Math.max(1, Math.min(Math.floor(maxUsers), 200));
  const db = getAdminFirestore();
  const usersSnapshot = await db.collection('users').limit(boundedMaxUsers).get();
  const summaries = await Promise.all((usersSnapshot.docs || []).map(async (userDoc: any) => {
    const summarySnapshot = await userDoc.ref.collection('productMetrics').doc('summary').get();
    return summarySnapshot.exists ? summarySnapshot.data() || {} : {};
  }));

  const eventTotals: Partial<Record<ProductEventName, number>> = {};
  let activeUsers = 0;
  let firstPostGeneratedUsers = 0;
  let secondPostGeneratedUsers = 0;
  let firstDraftCopiedUsers = 0;
  let firstAutomationDraftUsers = 0;

  for (const summary of summaries) {
    const events = summary.events && typeof summary.events === 'object' ? summary.events : {};
    const hasActivity = Object.values(events).some((value) => typeof value === 'number' && value > 0);
    if (hasActivity) activeUsers++;
    for (const event of PRODUCT_EVENT_NAMES) {
      const count = Number((events as Record<string, unknown>)[event] || 0);
      if (count > 0) eventTotals[event] = Number(eventTotals[event] || 0) + count;
    }
    const milestones = summary.milestones && typeof summary.milestones === 'object' ? summary.milestones : {};
    if (milestones.firstPostGeneratedAt) firstPostGeneratedUsers++;
    if (milestones.secondPostGeneratedAt) secondPostGeneratedUsers++;
    if (milestones.firstDraftCopiedAt) firstDraftCopiedUsers++;
    if (milestones.firstAutomationDraftAt) firstAutomationDraftUsers++;
  }

  return {
    generatedAt: new Date().toISOString(),
    usersScanned: summaries.length,
    activeUsers,
    eventTotals,
    funnel: {
      firstPostGeneratedUsers,
      secondPostGeneratedUsers,
      firstDraftCopiedUsers,
      firstAutomationDraftUsers,
    },
  };
}

function sanitizeProperties(properties: Record<string, unknown> = {}) {
  const safe: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SAFE_ENUM_KEYS.has(key) && typeof value === 'string' && value.length <= 40) safe[key] = value;
    if (SAFE_NUMBER_KEYS.has(key) && typeof value === 'number' && Number.isFinite(value)) safe[key] = Math.max(0, Math.min(value, 1_000_000));
  }
  return safe;
}

export async function recordProductEvent(
  userId: string | undefined,
  event: ProductEventName,
  properties: Record<string, unknown> = {},
): Promise<void> {
  if (!userId || process.env.PRODUCT_TELEMETRY_ENABLED !== 'true') return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const productMetrics = getAdminFirestore().collection('users').doc(userId).collection('productMetrics');
    const ref = productMetrics.doc(day);
    const summaryRef = productMetrics.doc('summary');
    const now = new Date().toISOString();
    await getAdminFirestore().runTransaction(async (transaction: any) => {
      const snapshot = await transaction.get(ref);
      const summarySnapshot = await transaction.get(summaryRef);
      const data = snapshot.exists ? snapshot.data() || {} : {};
      const summary = summarySnapshot.exists ? summarySnapshot.data() || {} : {};
      const events = { ...(data.events || {}) };
      events[event] = Number(events[event] || 0) + 1;
      const summaryEvents = { ...(summary.events || {}) };
      const previousSummaryCount = Number(summaryEvents[event] || 0);
      summaryEvents[event] = previousSummaryCount + 1;
      const milestones = { ...(summary.milestones || {}) };
      if (event === 'post_generated' && previousSummaryCount === 0) milestones.firstPostGeneratedAt = now;
      if (event === 'post_generated' && previousSummaryCount === 1) milestones.secondPostGeneratedAt = now;
      if (event === 'draft_copied' && previousSummaryCount === 0) milestones.firstDraftCopiedAt = now;
      if (event === 'automation_draft_generated' && previousSummaryCount === 0) milestones.firstAutomationDraftAt = now;
      transaction.set(ref, {
        day,
        events,
        updatedAt: now,
        lastProperties: { ...((data.lastProperties || {}) as Record<string, unknown>), [event]: sanitizeProperties(properties) },
      }, { merge: true });
      transaction.set(summaryRef, {
        events: summaryEvents,
        milestones,
        updatedAt: now,
      }, { merge: true });
    });
  } catch (error) {
    // Telemetry must never break the user workflow or expose raw payloads.
    console.warn('[Product telemetry] event not recorded:', error instanceof Error ? error.name : 'unknown error');
  }
}
