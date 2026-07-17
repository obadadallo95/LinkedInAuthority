import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

import aiRoutes from "./server/routes/ai";
import linkedinRoutes from "./server/routes/linkedin";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: "10mb" }));

  // Basic Authentication Middleware
  const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
  if (BASIC_AUTH_PASSWORD) {
    app.use((req, res, next) => {
      // Exclude health check from authentication
      if (req.path === "/api/health") {
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.setHeader("WWW-Authenticate", 'Basic realm="LinkedIn Authority Dev"');
        return res.status(401).send("Authentication required.");
      }

      try {
        const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
        const pass = auth[1];

        if (pass === BASIC_AUTH_PASSWORD) {
          return next();
        }
      } catch (e) {
        // Fall through to 401
      }

      res.setHeader("WWW-Authenticate", 'Basic realm="LinkedIn Authority Dev"');
      return res.status(401).send("Authentication required.");
    });
  }

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
  app.use("/api", linkedinRoutes);

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
