import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  AI_TASK_ROUTING, 
  calculateEstimatedCostUsd, 
  recordAiUsageTelemetry,
  AiTask
} from '../../server/services/repositoryIntelligence/modelRouting';
import { callGeminiWithRetry } from '../../server/services/repositoryIntelligence/gemini';

vi.mock('../../server/services/firestoreAdmin', () => ({
  getAdminFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          add: vi.fn().mockResolvedValue({ id: 'test-telemetry-id' })
        }))
      }))
    }))
  }))
}));

describe('Gemini Model Routing & Telemetry Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Task-Based Routing Mapping', () => {
    it('routes repo_analysis to gemini-3.7-flash with LOW thinking level', () => {
      const config = AI_TASK_ROUTING['repo_analysis'];
      expect(config.primaryModel).toBe('gemini-3.7-flash');
      expect(config.fallbackModel).toBe('gemini-3.6-flash');
      expect(config.thinkingLevel).toBe('LOW');
    });

    it('routes post_generation to gemini-3.7-flash with MEDIUM thinking level', () => {
      const config = AI_TASK_ROUTING['post_generation'];
      expect(config.primaryModel).toBe('gemini-3.7-flash');
      expect(config.fallbackModel).toBe('gemini-3.6-flash');
      expect(config.thinkingLevel).toBe('MEDIUM');
    });

    it('routes deep_synthesis to gemini-3.7-flash with LOW thinking level', () => {
      const config = AI_TASK_ROUTING['deep_synthesis'];
      expect(config.primaryModel).toBe('gemini-3.7-flash');
      expect(config.fallbackModel).toBe('gemini-3.6-flash');
      expect(config.thinkingLevel).toBe('LOW');
    });

    it('routes deep_post_generation to gemini-3.7-flash with MEDIUM thinking level', () => {
      const config = AI_TASK_ROUTING['deep_post_generation'];
      expect(config.primaryModel).toBe('gemini-3.7-flash');
      expect(config.fallbackModel).toBe('gemini-3.6-flash');
      expect(config.thinkingLevel).toBe('MEDIUM');
    });

    it('routes commit_analysis to gemini-3.5-flash-lite without thinking configuration', () => {
      const config = AI_TASK_ROUTING['commit_analysis'];
      expect(config.primaryModel).toBe('gemini-3.5-flash-lite');
      expect(config.fallbackModel).toBe('gemini-3.6-flash');
      expect(config.thinkingLevel).toBeUndefined();
    });

    it('routes hashtag_generation to gemini-3.5-flash-lite without thinking configuration', () => {
      const config = AI_TASK_ROUTING['hashtag_generation'];
      expect(config.primaryModel).toBe('gemini-3.5-flash-lite');
      expect(config.fallbackModel).toBe('gemini-3.6-flash');
      expect(config.thinkingLevel).toBeUndefined();
    });
  });

  describe('2. Token Cost Estimation', () => {
    it('calculates cost for gemini-3.7-flash including thought tokens in output price', () => {
      // 100,000 prompt tokens * $0.75/1M = $0.075
      // 20,000 candidate tokens + 10,000 thought tokens = 30,000 * $3.75/1M = $0.1125
      // Total = $0.1875
      const cost = calculateEstimatedCostUsd('gemini-3.7-flash', 100_000, 20_000, 10_000);
      expect(cost).toBe(0.1875);
    });

    it('calculates cost for gemini-3.5-flash-lite correctly', () => {
      // 100,000 prompt tokens * $0.30/1M = $0.03
      // 20,000 candidate tokens * $2.50/1M = $0.05
      // Total = $0.08
      const cost = calculateEstimatedCostUsd('gemini-3.5-flash-lite', 100_000, 20_000, 0);
      expect(cost).toBe(0.08);
    });

    it('falls back to gemini-3.6-flash rates for unlisted models', () => {
      // 1,000,000 prompt tokens * $1.50/1M = $1.50
      // 1,000,000 candidate tokens * $7.50/1M = $7.50
      // Total = $9.00
      const cost = calculateEstimatedCostUsd('unknown-model', 1_000_000, 1_000_000, 0);
      expect(cost).toBe(9.0);
    });
  });

  describe('3. callGeminiWithRetry Execution & Fallback Behavior', () => {
    it('invokes Gemini SDK with correct model, schema, and thinkingLevel config', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ success: true }),
        usageMetadata: {
          promptTokenCount: 150,
          candidatesTokenCount: 50,
          thoughtsTokenCount: 30,
          totalTokenCount: 230
        }
      });

      const mockClient = {
        models: {
          generateContent: mockGenerateContent
        }
      } as any;

      const result = await callGeminiWithRetry(
        mockClient,
        'Test prompt',
        'Test system instruction',
        { type: 'OBJECT' } as any,
        {
          task: 'post_generation',
          telemetryContext: {
            userId: 'user-123',
            feature: 'manual_generation',
            repository: 'owner/repo'
          }
        }
      );

      expect(result).toEqual({ success: true });
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.model).toBe('gemini-3.7-flash');
      expect(callArg.config.thinkingConfig).toEqual({ thinkingLevel: 'MEDIUM' });
    });

    it('gracefully falls back to fallbackModel on 404 / model not found error', async () => {
      const mockGenerateContent = vi.fn()
        .mockRejectedValueOnce(new Error('404 Model gemini-3.7-flash not found'))
        .mockResolvedValueOnce({
          text: JSON.stringify({ fallbackWorked: true }),
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 20,
            totalTokenCount: 120
          }
        });

      const mockClient = {
        models: {
          generateContent: mockGenerateContent
        }
      } as any;

      const result = await callGeminiWithRetry(
        mockClient,
        'Test prompt',
        'Test instruction',
        { type: 'OBJECT' } as any,
        { task: 'repo_analysis' }
      );

      expect(result).toEqual({ fallbackWorked: true });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-3.7-flash');
      expect(mockGenerateContent.mock.calls[1][0].model).toBe('gemini-3.6-flash');
    });

    it('does not throw when telemetry writing fails', async () => {
      const { getAdminFirestore } = await import('../../server/services/firestoreAdmin');
      (getAdminFirestore as any).mockReturnValueOnce({
        collection: () => {
          throw new Error('Firestore connection failed');
        }
      });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ data: 'ok' }),
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 }
      });

      const mockClient = { models: { generateContent: mockGenerateContent } } as any;

      const result = await callGeminiWithRetry(
        mockClient,
        'Test prompt',
        'Test instruction',
        { type: 'OBJECT' } as any,
        {
          task: 'commit_analysis',
          telemetryContext: { userId: 'user-xyz' }
        }
      );

      expect(result).toEqual({ data: 'ok' });
    });
  });
});
