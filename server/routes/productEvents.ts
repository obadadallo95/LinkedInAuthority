import { Router } from 'express';
import { getProductTelemetrySummary, isProductEventName, recordProductEvent } from '../services/productTelemetry';

const router = Router();

function isTrustedTelemetryOperator(req: any): boolean {
  // Firebase custom claims are set server-side and cannot be supplied by the
  // browser. Do not use a client-readable settings.role for this boundary.
  return req.user?.admin === true || req.user?.role === 'admin' || req.user?.role === 'founder';
}

router.get('/summary', async (req: any, res) => {
  if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });
  if (!isTrustedTelemetryOperator(req)) return res.status(403).json({ error: 'Telemetry summary requires operator access.' });

  const requestedLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 200) {
    return res.status(400).json({ error: 'Telemetry summary limit must be an integer between 1 and 200.' });
  }

  try {
    return res.json(await getProductTelemetrySummary(requestedLimit));
  } catch (error) {
    console.error('Product telemetry summary failed:', error instanceof Error ? error.name : 'unknown');
    return res.status(503).json({ error: 'Telemetry summary is temporarily unavailable.' });
  }
});

router.post('/', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const event = req.body?.event;
  const properties = req.body?.properties;
  if (!isProductEventName(event) || (properties !== undefined && (!properties || typeof properties !== 'object' || Array.isArray(properties)))) {
    return res.status(400).json({ error: 'Invalid product event.' });
  }
  if (JSON.stringify(properties || {}).length > 2000) {
    return res.status(413).json({ error: 'Product event properties are too large.' });
  }
  await recordProductEvent(uid, event, properties || {});
  return res.status(202).json({ accepted: true });
});

export default router;
