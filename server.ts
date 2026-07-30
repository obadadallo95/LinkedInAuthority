import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import aiRoutes from "./server/routes/ai";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

// Initialize Firebase Admin (using project config without service account for ID token verification only)
try {
  const configRaw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  const config = JSON.parse(configRaw);
  initializeApp({
    projectId: config.projectId,
  });
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

  app.use(express.json({ limit: "10mb" }));

  // Firebase Auth Middleware for API routes
  app.use("/api", async (req, res, next) => {
    // Exclude health check from authentication
    if (req.path === "/health") {
      return next();
    }

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
      console.error("Firebase Auth Error:", error);
      return res.status(401).json({ error: "Authentication failed. Invalid or expired token." });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Explicit route to handle/clear sw.js to resolve PWA caches from the old app
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.send(`
      self.addEventListener('install', (e) => self.skipWaiting());
      self.addEventListener('activate', (e) => {
        self.registration.unregister()
          .then(() => self.clients.matchAll())
          .then((clients) => { clients.forEach(c => c.navigate(c.url)); });
      });
    `);
  });

  // Mount API Routers
  app.use("/api", aiRoutes);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Global Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message || "Unknown error occurred" });
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
