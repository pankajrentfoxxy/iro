import type { AuthUser, JurisdictionScope } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      jurisdiction?: JurisdictionScope;
      requestId?: string;
    }
  }
}

export {};
