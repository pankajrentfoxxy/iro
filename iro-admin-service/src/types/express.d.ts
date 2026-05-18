import type { AdminAuthUser } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AdminAuthUser;
      adminRequestId?: string;
    }
  }
}

export {};
