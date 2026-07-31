import crypto from 'crypto';
import { AnalysisTokenPayload } from './types';

export function getAnalysisSigningSecret(): string {
  const secret = process.env.ANALYSIS_SIGNING_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);
  if (!secret) {
    throw new Error("Configuration Error: ANALYSIS_SIGNING_SECRET is not set in the environment.");
  }
  return secret;
}

export function signAnalysisToken(payload: Omit<AnalysisTokenPayload, "issuedAt" | "expiresAt">): string {
  const now = Date.now();
  const fullPayload: AnalysisTokenPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + 60 * 60 * 1000 // 60 minutes
  };

  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64');
  const signature = crypto.createHmac('sha256', getAnalysisSigningSecret()).update(data).digest('hex');
  
  return `${data}.${signature}`;
}

export function verifyAnalysisToken(token: string): AnalysisTokenPayload {
  if (!token || typeof token !== 'string') {
    throw new Error("Missing or invalid token format");
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error("Invalid analysis token structure");
  }

  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', getAnalysisSigningSecret()).update(data).digest('hex');
  
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  const sigBuf = Buffer.from(signature, 'hex');
  
  if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
    throw new Error("Invalid token signature");
  }

  let payload: AnalysisTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
  } catch (e) {
    throw new Error("Malformed token payload");
  }

  // Runtime Validation
  if (!payload || typeof payload !== 'object') throw new Error("Invalid payload format");
  if (payload.version !== 1) throw new Error("Unsupported token version");
  if (typeof payload.repository !== 'string' || !payload.repository) throw new Error("Missing repository in token");
  if (typeof payload.lang !== 'string' || !payload.lang) throw new Error("Missing lang in token");
  if (typeof payload.intent !== 'string' || !payload.intent) throw new Error("Missing intent in token");
  if (!Array.isArray(payload.angles)) throw new Error("Missing or invalid angles in token");
  if (!Array.isArray(payload.atomicFacts)) throw new Error("Missing or invalid atomicFacts in token");
  if (!Array.isArray(payload.conflicts)) throw new Error("Missing or invalid conflicts in token");
  if (typeof payload.issuedAt !== 'number') throw new Error("Missing issuedAt in token");
  if (typeof payload.expiresAt !== 'number') throw new Error("Missing expiresAt in token");
  if (payload.audience !== 'demo' && payload.audience !== 'authenticated') throw new Error("Invalid audience in token");
  
  if (payload.audience === 'authenticated' && typeof payload.userId !== 'string') {
    throw new Error("Missing userId for authenticated token");
  }

  if (Date.now() > payload.expiresAt) {
    throw new Error("Analysis token expired");
  }

  return payload;
}
