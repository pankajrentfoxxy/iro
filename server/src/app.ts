import express from "express";
import helmet from "helmet";
import cors from "cors";
import type { CorsOptions } from "cors";
import compression from "compression";
import { api } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { auditMiddleware } from "./middleware/audit.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

function permissiveCors(): CorsOptions {
  return {
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  };
}

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors(permissiveCors()));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(apiLimiter);
  app.use(auditMiddleware);
  app.use("/api", api);
  app.use(errorMiddleware);
  return app;
}
