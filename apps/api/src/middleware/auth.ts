import type { NextFunction, Request, Response } from "express";
import { getAuthContext, hasScope, type AuthContext } from "../services/auth0.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthContext["user"];
      authScopes?: string[];
    }
  }
}

export async function attachAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = await getAuthContext(req);
    req.authUser = ctx.user;
    req.authScopes = ctx.scopes;
    next();
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}

export function requireScope(scope: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!await hasScope(req, scope)) {
      return res.status(403).json({ error: `Missing required scope: ${scope}` });
    }

    return next();
  };
}
