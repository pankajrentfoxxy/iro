import "dotenv/config";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import "./sms.worker.js";
import "./notification.worker.js";
import "./analytics.worker.js";

logger.info("workers online", { env: env.NODE_ENV });
