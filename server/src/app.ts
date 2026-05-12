import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env } from "./config/env.js";
import { api } from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { auditMiddleware } from "./middleware/audit.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

const corsOrigins =
  env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((o) => o.trim());

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(apiLimiter);
  app.use(auditMiddleware);
  app.use("/api", api);
  app.use(errorMiddleware);
  return app;
}
