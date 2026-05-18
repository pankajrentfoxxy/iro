export const logger = {
  info: (...args: unknown[]) => console.log("[admin]", ...args),
  warn: (...args: unknown[]) => console.warn("[admin]", ...args),
  error: (...args: unknown[]) => console.error("[admin]", ...args),
};
