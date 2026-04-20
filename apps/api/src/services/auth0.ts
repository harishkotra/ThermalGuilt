import type { Request } from "express";
import jwt from "jsonwebtoken";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";
import type { AuthUser } from "../types.js";

export type AuthContext = {
  scopes: string[];
  user: AuthUser;
};

const demoUser: AuthUser = {
  userId: "auth0|demo-user",
  handle: "@thermal_hero",
  neighborhoodId: "n-94107-west",
  zipCode: "94107",
  walletAddress: "DemoWallet11111111111111111111111111111111"
};

function normalizeAuth0Domain(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

const auth0Domain = normalizeAuth0Domain(config.auth0.domain);

let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
if (auth0Domain) {
  try {
    JWKS = createRemoteJWKSet(new URL(`https://${auth0Domain}/.well-known/jwks.json`));
  } catch {
    JWKS = null;
  }
}

function readUserFromClaims(payload: Record<string, unknown>): AuthUser {
  const ns = config.auth0.namespace;
  const claimUser = payload[`${ns}/user`] as Partial<AuthUser> | undefined;
  return {
    userId: String(payload.sub || claimUser?.userId || demoUser.userId),
    handle: String(claimUser?.handle || payload.nickname || "@thermal_user"),
    neighborhoodId: String(claimUser?.neighborhoodId || "n-94107-west"),
    zipCode: String(claimUser?.zipCode || "94107"),
    walletAddress: typeof claimUser?.walletAddress === "string" ? claimUser.walletAddress : undefined
  };
}

export function createDemoJwt(scopes: string[]) {
  return jwt.sign(
    {
      sub: demoUser.userId,
      scope: scopes.join(" "),
      [`${config.auth0.namespace}/user`]: demoUser
    },
    "dev-only-secret",
    { expiresIn: "1h" }
  );
}

export async function getAuthContext(req: Request): Promise<AuthContext> {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return { scopes: ["read:energy", "read:neighborhood", "write:thermostat"], user: demoUser };
  }

  if (!JWKS || config.testMode) {
    const decoded = jwt.decode(token) as Record<string, unknown> | null;
    const scope = typeof decoded?.scope === "string" ? decoded.scope : "read:energy read:neighborhood";
    return {
      scopes: scope.split(" ").filter(Boolean),
      user: decoded ? readUserFromClaims(decoded) : demoUser
    };
  }

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://${auth0Domain}/`,
    audience: config.auth0.audience
  });

  const scope = typeof payload.scope === "string" ? payload.scope : "";
  return {
    scopes: scope.split(" ").filter(Boolean),
    user: readUserFromClaims(payload as Record<string, unknown>)
  };
}

export async function hasScope(req: Request, requiredScope: string) {
  const ctx = await getAuthContext(req);
  return ctx.scopes.includes(requiredScope);
}

async function getM2MToken() {
  if (!config.auth0.agentClientId || !config.auth0.agentClientSecret || !auth0Domain) {
    throw new Error("Auth0 M2M credentials are not configured");
  }

  const response = await fetch(`https://${auth0Domain}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: config.auth0.agentClientId,
      client_secret: config.auth0.agentClientSecret,
      audience: config.auth0.audience
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth0 token request failed: ${text}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

export async function requestCibaApproval(userId: string, action: string) {
  if (config.testMode || !auth0Domain || !config.auth0.clientId || !config.auth0.clientSecret) {
    return {
      approvalId: `ciba_${Date.now()}`,
      userId,
      action,
      status: "pending",
      message: "CIBA approval simulated in test/dev mode."
    };
  }

  const token = await getM2MToken();
  const response = await fetch(`https://${auth0Domain}/bc-authorize`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Bearer ${token}`
    },
    body: new URLSearchParams({
      client_id: config.auth0.clientId,
      client_secret: config.auth0.clientSecret,
      scope: "openid profile",
      login_hint: userId,
      binding_message: action
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth0 CIBA request failed: ${text}`);
  }

  const data = await response.json() as { auth_req_id: string; expires_in: number; interval?: number };
  return {
    approvalId: data.auth_req_id,
    userId,
    action,
    status: "pending",
    expiresIn: data.expires_in,
    pollIntervalSec: data.interval ?? 5,
    message: "CIBA backchannel approval requested."
  };
}
