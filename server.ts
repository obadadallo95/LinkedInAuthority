import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

import aiRoutes from "./server/routes/ai";
import integrationRoutes from "./server/routes/integrations";
import demoRoutes from "./server/routes/demo";
import cronRoutes from "./server/routes/cron";
import accountRoutes from "./server/routes/account";
import automationRoutes from "./server/routes/automation";
import productEventRoutes from "./server/routes/productEvents";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import fs from "fs";

import { getFirestoreDatabaseId } from "./server/services/firestoreAdmin";

// Initialize Firebase Admin (using project config without service account for ID token verification only)
try {
  const configRaw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  const config = JSON.parse(configRaw);
  initializeApp({
    projectId: config.projectId,
  });
  const dbId = getFirestoreDatabaseId();
  if (dbId) {
    console.log(`Firebase Admin initialized for project: ${config.projectId}, Firestore DB: ${dbId}`);
  }
} catch (e) {
  console.warn("Failed to load firebase-applet-config.json. Auth might fail if project ID is not set.", e);
  // Fallback to default if there are env variables
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
      initializeApp();
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set('trust proxy', 1);

  const requestBodyLimits: Array<{ prefix: string; bytes: number }> = [
    { prefix: '/api/demo', bytes: 64 * 1024 },
    { prefix: '/api/analyze-repo', bytes: 128 * 1024 },
    { prefix: '/api/generate-post', bytes: 128 * 1024 },
    { prefix: '/api/analyze-commits', bytes: 128 * 1024 },
    { prefix: '/api/deep-scan', bytes: 128 * 1024 },
    { prefix: '/api/optimize-post', bytes: 128 * 1024 },
    { prefix: '/api/generate-hashtags', bytes: 128 * 1024 },
    { prefix: '/api/account', bytes: 32 * 1024 },
    { prefix: '/api/automation', bytes: 32 * 1024 },
    { prefix: '/api/integrations', bytes: 32 * 1024 },
    { prefix: '/api/product-events', bytes: 32 * 1024 },
    { prefix: '/api/cron', bytes: 32 * 1024 },
  ];
  app.use((req, res, next) => {
    const contentLengthHeader = req.headers['content-length'];
    const contentLength = typeof contentLengthHeader === 'string' ? Number(contentLengthHeader) : NaN;
    const limit = requestBodyLimits.find((entry) => req.path.startsWith(entry.prefix))?.bytes ?? 256 * 1024;
    if (Number.isFinite(contentLength) && contentLength > limit) {
      return res.status(413).json({ error: 'Request body is too large for this endpoint.' });
    }
    return next();
  });
  // The early route-aware guard above protects normal Content-Length requests;
  // this parser limit is the final bound for chunked/unknown-length bodies.
  app.use(express.json({ limit: "256kb" }));
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Rate Limiting for authenticated API routes (keyed by Firebase Auth user UID or IP)
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each user to 50 authenticated API requests per hour
    // Count malformed and failed authenticated requests too. The capability
    // ledger separately enforces the stricter AI cost/request limits, while
    // this guard prevents cheap invalid-request abuse from bypassing the
    // hourly boundary.
    keyGenerator: (req: express.Request) => {
      return (req as any).user?.uid || ipKeyGenerator(req.ip || "0.0.0.0");
    },
    message: { error: "لقد تجاوزت الحد المسموح به من الطلبات لهذه الساعة (50 طلب). يرجى الانتظار والتجربة لاحقاً." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Protect the Firebase verification boundary itself. The user-scoped
  // limiter below only runs after a token verifies, so malformed/expired
  // bearer tokens could otherwise consume verification work without being
  // counted. This is deliberately an IP-level, non-AI guard; capability and
  // cost ledgers remain the source of truth for model calls.
  const authBoundaryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    keyGenerator: (req: express.Request) => ipKeyGenerator(req.ip || "0.0.0.0"),
    message: { error: "Too many authentication attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Public unauthenticated demo routes
  app.use("/api/demo", demoRoutes);

  // Unauthenticated cron endpoints (secured via CRON_SECRET inside)
  app.use("/api/cron", cronRoutes);

  // Health check endpoint (unauthenticated)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // This is mounted after demo/cron/health, so only protected API traffic is
  // counted. It also runs before Firebase token verification by design.
  app.use("/api", authBoundaryLimiter);

  // Firebase Auth Middleware for remaining protected /api routes
  app.use("/api", async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required. Missing or invalid Bearer token." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      (req as any).user = decodedToken;
      return next();
    } catch (error) {
      // Do not log the token, decoded claims, or a full verifier stack for
      // attacker-controlled requests. The boundary limiter above already
      // contains repeated failures; an error code is sufficient for ops.
      const authErrorCode = typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: unknown }).code || 'unknown')
        : 'unknown';
      console.warn("Firebase Auth rejected a request:", authErrorCode);
      return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
    }
  });

  // Apply the same abuse guard to every authenticated API surface, not only AI.
  // Capability-specific usage ledgers remain the source of truth for AI cost limits.
  app.use("/api", authLimiter);
  app.use("/api", aiRoutes);
  app.use("/api/integrations", integrationRoutes);
  app.use("/api/account", accountRoutes);
  app.use("/api/automation", automationRoutes);
  app.use("/api/product-events", productEventRoutes);

  // Serve the versioned worker explicitly so Vite/static middleware cannot
  // return a stale legacy unregistering worker during upgrades.
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.sendFile(path.join(process.cwd(), "public", "sw.js"));
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Keep provider messages, request bodies, tokens, and stack traces out of
    // the default production log stream. The client receives the same generic
    // response, while operators still get enough stable context to correlate
    // the failing surface without persisting user content or secrets.
    const isPayloadTooLarge = err?.status === 413 || err?.type === 'entity.too.large';
    console.error("Unhandled Global Error:", {
      name: err instanceof Error ? err.name : "unknown",
      method: req.method,
      path: req.path,
      status: isPayloadTooLarge ? 413 : 500,
    });
    if (isPayloadTooLarge) {
      return res.status(413).json({ error: "Request body is too large for this endpoint." });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
