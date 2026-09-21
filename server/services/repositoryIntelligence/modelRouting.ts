import { getAdminFirestore } from '../firestoreAdmin';

export type AiTask =
  | 'repo_analysis'
  | 'post_generation'
  | 'post_optimize'
  | 'deep_synthesis'
  | 'deep_post_generation'
  | 'commit_analysis'
  | 'hashtag_generation';

export type ThinkingLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskRoutingConfig {
  primaryModel: string;
  fallbackModel: string;
  thinkingLevel?: ThinkingLevel;
  maxOutputTokens: number;
  description: string;
}

type ModelPricing = {
  inputPricePer1M: number;
  outputPricePer1M: number;
  isIntroductory?: boolean;
  nextInputPricePer1M?: number;
  nextOutputPricePer1M?: number;
  nextPriceEffectiveAt?: string;
};

/**
 * Centralized AI Task-to-Model Routing Configuration
 * 
 * CORE & HIGH-STAKES:
 * - repo_analysis: gemini-3.7-flash with LOW thinking
 * - post_generation: gemini-3.7-flash with MEDIUM thinking
 * - deep_synthesis: gemini-3.7-flash with LOW thinking
 * - deep_post_generation: gemini-3.7-flash with MEDIUM thinking
 * 
 * LIGHT & HIGH-VOLUME:
 * - commit_analysis: gemini-3.1-flash-lite
 * - hashtag_generation: gemini-3.1-flash-lite
 */
export const AI_TASK_ROUTING: Record<AiTask, TaskRoutingConfig> = {
  repo_analysis: {
    primaryModel: 'gemini-3.7-flash',
    fallbackModel: 'gemini-3.6-flash',
    thinkingLevel: 'LOW',
    maxOutputTokens: 4096,
    description: 'Repository semantic analysis, atomic facts, and angle discovery'
  },
  post_generation: {
    primaryModel: 'gemini-3.7-flash',
    fallbackModel: 'gemini-3.6-flash',
    thinkingLevel: 'MEDIUM',
    maxOutputTokens: 2048,
    description: 'Manual and demo LinkedIn post generation adhering to evidence and constraints'
  },
  post_optimize: {
    primaryModel: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-3.5-flash-lite',
    maxOutputTokens: 1400,
    description: 'Low-cost evidence-preserving edits to an existing LinkedIn draft'
  },
  deep_synthesis: {
    primaryModel: 'gemini-3.7-flash',
    fallbackModel: 'gemini-3.6-flash',
    thinkingLevel: 'LOW',
    maxOutputTokens: 4096,
    description: 'Deep Scan and scheduled automation context synthesis grounded in repo identity'
  },
  deep_post_generation: {
    primaryModel: 'gemini-3.7-flash',
    fallbackModel: 'gemini-3.6-flash',
    thinkingLevel: 'MEDIUM',
    maxOutputTokens: 2048,
    description: 'Scheduled automated and deep scan LinkedIn post copywriting'
  },
  commit_analysis: {
    primaryModel: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-3.5-flash-lite',
    maxOutputTokens: 900,
    description: 'Fast commit changelog and technical update summarization'
  },
  hashtag_generation: {
    primaryModel: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-3.5-flash-lite',
    maxOutputTokens: 900,
    description: 'Lightweight professional social hashtag suggestion'
  }
};

/**
 * Centralized Gemini Pricing Table (Per 1 Million Tokens).
 * Verified against Google's pricing/model docs on 2026-09-21:
 * https://ai.google.dev/gemini-api/docs/pricing
 * https://ai.google.dev/gemini-api/docs/models
 * Note: Gemini 3.6/3.7 pricing is introductory ($0.75 input / $3.75 output)
 * through Dec 31, 2026; thinking tokens are counted under output pricing.
 * Gemini 3.1 Flash-Lite is the low-cost stable model ($0.25 input / $1.50 output)
 * through the current pricing schedule; verify this table before enabling paid traffic.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-3.7-flash': {
    inputPricePer1M: 0.75,
    outputPricePer1M: 3.75,
    isIntroductory: true,
    nextInputPricePer1M: 1.50,
    nextOutputPricePer1M: 7.50,
    nextPriceEffectiveAt: '2027-01-01T00:00:00.000Z'
  },
  'gemini-3.6-flash': {
    inputPricePer1M: 0.75,
    outputPricePer1M: 3.75,
    isIntroductory: true,
    nextInputPricePer1M: 1.50,
    nextOutputPricePer1M: 7.50,
    nextPriceEffectiveAt: '2027-01-01T00:00:00.000Z'
  },
  'gemini-3.5-flash': {
    inputPricePer1M: 1.50,
    outputPricePer1M: 9.00
  },
  'gemini-3.5-flash-lite': {
    inputPricePer1M: 0.30,
    outputPricePer1M: 2.50
  },
  'gemini-3.1-flash-lite': {
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.50
  },
  'gemini-flash-latest': {
    inputPricePer1M: 1.50,
    outputPricePer1M: 7.50
  }
};

/**
 * Calculates estimated USD cost based on token consumption.
 * Explicitly separates thought tokens and treats them under output pricing rules.
 */
export function calculateEstimatedCostUsd(
  model: string,
  promptTokens: number = 0,
  candidateTokens: number = 0,
  thoughtTokens: number = 0,
  at: Date = new Date()
): number {
  const basePricing = MODEL_PRICING[model] || MODEL_PRICING['gemini-3.6-flash'];
  const nextPriceAt = basePricing.nextPriceEffectiveAt ? new Date(basePricing.nextPriceEffectiveAt) : null;
  const pricing = nextPriceAt && at >= nextPriceAt && basePricing.nextInputPricePer1M !== undefined && basePricing.nextOutputPricePer1M !== undefined
    ? { inputPricePer1M: basePricing.nextInputPricePer1M, outputPricePer1M: basePricing.nextOutputPricePer1M }
    : basePricing;
  const inputCost = (promptTokens / 1_000_000) * pricing.inputPricePer1M;
  // Total output tokens billed by Gemini includes candidate output and thinking tokens if any
  const billedOutputTokens = candidateTokens + thoughtTokens;
  const outputCost = (billedOutputTokens / 1_000_000) * pricing.outputPricePer1M;
  return Number((inputCost + outputCost).toFixed(8));
}

export interface TelemetryContext {
  userId?: string;
  feature?: string;
  isDemo?: boolean;
  isAutomated?: boolean;
  repository?: string;
}

export interface AiUsageTelemetry {
  task: AiTask;
  requestedModel: string;
  actualModel: string;
  thinkingLevel?: ThinkingLevel;
  promptTokens: number;
  candidateTokens: number;
  thoughtTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  retryCount: number;
  feature?: string;
  isDemo?: boolean;
  isAutomated?: boolean;
  repository?: string;
  timestamp: string;
}

/**
 * Records AI usage telemetry to Firestore in a non-blocking, fail-safe manner.
 * Telemetry failures are logged but never interrupt the primary user flow.
 */
export async function recordAiUsageTelemetry(
  context: TelemetryContext | undefined,
  telemetry: AiUsageTelemetry
): Promise<void> {
  // Fire and forget
  try {
    const userId = context?.userId;
    if (!userId || userId === 'anonymous_demo') {
      // For anonymous demo, record in system-level telemetry or skip to avoid storing raw PII
      return;
    }

    const db = getAdminFirestore();
    const usageColl = db.collection('users').doc(userId).collection('aiUsage');
    await usageColl.add({
      ...telemetry,
      createdAt: telemetry.timestamp
    });
  } catch (error: any) {
    // Non-blocking warning only
    console.warn('[Telemetry] Non-critical failed to record AI usage telemetry:', error instanceof Error ? error.name : 'unknown');
  }
}
