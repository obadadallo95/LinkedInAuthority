import { getAdminFirestore } from './firestoreAdmin';
import { UserTier } from './entitlements';

export type AiCapability = 'repo.analysis' | 'repo.deep_scan' | 'post.generate' | 'post.optimize' | 'commit.analyze' | 'hashtags.generate' | 'automation.enabled';

const LIMITS: Record<UserTier, Record<AiCapability, { requests: number; reservedCostUsd: number }>> = {
  free: {
    'repo.analysis': { requests: 10, reservedCostUsd: 0.25 },
    'repo.deep_scan': { requests: 2, reservedCostUsd: 0.50 },
    'post.generate': { requests: 10, reservedCostUsd: 0.25 },
    'post.optimize': { requests: 10, reservedCostUsd: 0.10 },
    'commit.analyze': { requests: 10, reservedCostUsd: 0.10 },
    'hashtags.generate': { requests: 10, reservedCostUsd: 0.05 },
    // Automation can perform a deep scan plus grounded post generation and a
    // bounded provider fallback. Reserve the whole run, not only the gate
    // request, so retries cannot bypass the daily cost ceiling.
    'automation.enabled': { requests: 2, reservedCostUsd: 1.00 },
  },
  pro: {
    'repo.analysis': { requests: 100, reservedCostUsd: 5 },
    'repo.deep_scan': { requests: 25, reservedCostUsd: 10 },
    'post.generate': { requests: 100, reservedCostUsd: 5 },
    'post.optimize': { requests: 100, reservedCostUsd: 2 },
    'commit.analyze': { requests: 100, reservedCostUsd: 2 },
    'hashtags.generate': { requests: 100, reservedCostUsd: 1 },
    'automation.enabled': { requests: 30, reservedCostUsd: 15 },
  },
};

type LedgerState = { requests: number; reservedCostUsd: number; updatedAt: string };
const memoryLedger = new Map<string, LedgerState>();
const memoryDailyTotals = new Map<string, number>();

const DAILY_RESERVED_COST_USD: Record<UserTier, number> = {
  free: 1,
  pro: 25,
};

function getReservedCostTotal(data: Record<string, any>): number {
  if (typeof data.totalReservedCostUsd === 'number') return data.totalReservedCostUsd;
  return Object.entries(data).reduce((total, [key, value]) => {
    if (key === 'totalReservedCostUsd' || key === 'updatedAt' || !value || typeof value !== 'object') return total;
    return total + (typeof value.reservedCostUsd === 'number' ? value.reservedCostUsd : 0);
  }, 0);
}

export async function consumeAiCapability(userId: string, capability: AiCapability, tier: UserTier): Promise<boolean> {
  const limit = LIMITS[tier][capability];
  const day = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${day}:${capability}`;

  if (process.env.NODE_ENV === 'test') {
    const current = memoryLedger.get(key) || { requests: 0, reservedCostUsd: 0, updatedAt: new Date().toISOString() };
    const dailyTotal = memoryDailyTotals.get(`${userId}:${day}`) || 0;
    if (current.requests >= limit.requests || dailyTotal + limit.reservedCostUsd > DAILY_RESERVED_COST_USD[tier]) return false;
    memoryLedger.set(key, { requests: current.requests + 1, reservedCostUsd: current.reservedCostUsd + limit.reservedCostUsd, updatedAt: new Date().toISOString() });
    memoryDailyTotals.set(`${userId}:${day}`, dailyTotal + limit.reservedCostUsd);
    return true;
  }

  try {
    const db = getAdminFirestore();
    const ref = db.collection('users').doc(userId).collection('usageLedger').doc(day);
    return await db.runTransaction(async transaction => {
      const snap = await transaction.get(ref);
      const data = snap.exists ? snap.data() || {} : {};
      const current = data[capability] || { requests: 0, reservedCostUsd: 0 };
      const dailyTotal = getReservedCostTotal(data);
      if (current.requests >= limit.requests || dailyTotal + limit.reservedCostUsd > DAILY_RESERVED_COST_USD[tier]) return false;
      transaction.set(ref, {
        ...data,
        totalReservedCostUsd: Number((dailyTotal + limit.reservedCostUsd).toFixed(8)),
        [capability]: {
          requests: current.requests + 1,
          reservedCostUsd: current.reservedCostUsd + limit.reservedCostUsd,
          updatedAt: new Date().toISOString(),
        },
      }, { merge: true });
      return true;
    });
  } catch (error) {
    console.error('AI usage ledger unavailable; denying capability:', error instanceof Error ? error.message : 'unknown error');
    return false;
  }
}

export function resetMemoryUsageLedgerForTests() {
  memoryLedger.clear();
  memoryDailyTotals.clear();
}
