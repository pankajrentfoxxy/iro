import { env } from "../config/env.js";

type Level = "info" | "warn" | "error" | "debug";

function log(level: Level, msg: string, meta?: unknown) {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta !== undefined ? { meta } : {}),
  };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (env.NODE_ENV === "development") console.log(text);
}

export const logger = {
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
};
