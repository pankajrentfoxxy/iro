import express from "express";
import helmet from "helmet";
import cors from "cors";
import type { CorsOptions } from "cors";
import compression from "compression";
import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { auditMiddleware } from "./middleware/audit.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

/** Reflect request Origin when credentials are sent — avoids wildcard+CORS credential conflicts */
export function permissiveCors(): CorsOptions {
  return {
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  };
}

export const ADMIN_API_PREFIX = "/api/admin";

export function createAdminApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors(permissiveCors()));
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(apiLimiter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "iro-admin-service" });
  });

  app.use(auditMiddleware);
  app.use(ADMIN_API_PREFIX, apiRouter);
  app.use(errorMiddleware);

  return app;
}
