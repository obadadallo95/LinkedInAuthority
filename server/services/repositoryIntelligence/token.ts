import crypto from 'crypto';
import { AnalysisTokenPayload } from './types';

const SECRET = process.env.ANALYSIS_SIGNING_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret' : undefined);

if (!SECRET) {
  console.error("FATAL ERROR: ANALYSIS_SIGNING_SECRET is not set in the environment.");
  process.exit(1);
}

export function signAnalysisToken(payload: Omit<AnalysisTokenPayload, "issuedAt" | "expiresAt">): string {
  const now = Date.now();
  const fullPayload: AnalysisTokenPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + 60 * 60 * 1000 // 60 minutes
  };

  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  
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
  const expectedSignature = crypto.createHmac('sha256', SECRET!).update(data).digest('hex');
  
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

  if (payload.version !== 1) {
    throw new Error("Unsupported token version");
  }

  if (Date.now() > payload.expiresAt) {
    throw new Error("Analysis token expired");
  }

  return payload;
}
