import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "fund_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAgentToken(request: NextRequest): boolean {
  const expected = process.env.FUND_AGENT_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && supplied && safeEqual(expected, supplied));
}

export function authorizeAgent(request: NextRequest): NextResponse | null {
  return verifyAgentToken(request) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function sessionSecret() {
  return process.env.FUND_SESSION_SECRET;
}

export function createSessionToken(now = Date.now()) {
  const secret = sessionSecret();
  if (!secret || secret.length < 32) throw new Error("FUND_SESSION_SECRET must contain at least 32 characters");
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(expiresAt + ":" + randomBytes(18).toString("base64url")).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + signature;
}

export function verifySessionToken(token?: string | null, now = Date.now()): boolean {
  const secret = sessionSecret();
  if (!secret || secret.length < 32 || !token) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(expected, signature)) return false;
  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [expiresAt, nonce, remainder] = decoded.split(":");
    if (!expiresAt || !/^\d+$/.test(expiresAt) || !nonce || remainder) return false;
    return Number(expiresAt) > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function hasUserSession(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function authorizeUserOrAgent(request: NextRequest): NextResponse | null {
  return verifyAgentToken(request) || hasUserSession(request)
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const sessionCookieName = SESSION_COOKIE;
export const sessionTtlSeconds = SESSION_TTL_SECONDS;
