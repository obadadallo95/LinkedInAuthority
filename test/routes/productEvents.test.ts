import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getProductTelemetrySummary, recordProductEvent } = vi.hoisted(() => ({
  getProductTelemetrySummary: vi.fn(),
  recordProductEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../server/services/productTelemetry', () => ({
  getProductTelemetrySummary,
  isProductEventName: (value: unknown) => value === 'post_generated',
  recordProductEvent,
}));

import express from 'express';
import request from 'supertest';
import productEventRoutes from '../../server/routes/productEvents';

function createApp(user: Record<string, unknown> | null) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.user = user;
    next();
  });
  app.use('/api/product-events', productEventRoutes);
  return app;
}

describe('product telemetry reporting route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProductTelemetrySummary.mockResolvedValue({
      generatedAt: '2026-09-21T00:00:00.000Z',
      usersScanned: 2,
      activeUsers: 1,
      eventTotals: { post_generated: 2 },
      funnel: {
        firstPostGeneratedUsers: 1,
        secondPostGeneratedUsers: 1,
        firstDraftCopiedUsers: 0,
        firstAutomationDraftUsers: 0,
      },
    });
  });

  it('rejects non-operator access without reading telemetry', async () => {
    const response = await request(createApp({ uid: 'user-1' })).get('/api/product-events/summary');
    expect(response.status).toBe(403);
    expect(getProductTelemetrySummary).not.toHaveBeenCalled();
  });

  it('returns bounded content-free summary to a server-claimed operator', async () => {
    const response = await request(createApp({ uid: 'admin-1', admin: true })).get('/api/product-events/summary?limit=25');
    expect(response.status).toBe(200);
    expect(getProductTelemetrySummary).toHaveBeenCalledWith(25);
    expect(response.body.eventTotals).toEqual({ post_generated: 2 });
    expect(response.body.funnel.secondPostGeneratedUsers).toBe(1);
  });

  it('rejects an unbounded reporting request', async () => {
    const response = await request(createApp({ uid: 'admin-1', role: 'admin' })).get('/api/product-events/summary?limit=201');
    expect(response.status).toBe(400);
    expect(getProductTelemetrySummary).not.toHaveBeenCalled();
  });
});
