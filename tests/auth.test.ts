import test from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, verifySessionToken } from "../lib/auth";

test("signed owner session verifies before expiry", () => {
  process.env.FUND_SESSION_SECRET = "test-secret-that-is-long-enough-for-session-signing";
  const now = 1_800_000_000_000;
  const token = createSessionToken(now);
  assert.equal(verifySessionToken(token, now), true);
});

test("tampered session is rejected", () => {
  process.env.FUND_SESSION_SECRET = "test-secret-that-is-long-enough-for-session-signing";
  const token = createSessionToken(1_800_000_000_000);
  assert.equal(verifySessionToken(token + "x", 1_800_000_000_000), false);
});

test("expired session is rejected", () => {
  process.env.FUND_SESSION_SECRET = "test-secret-that-is-long-enough-for-session-signing";
  const issuedAt = 1_800_000_000_000;
  const token = createSessionToken(issuedAt);
  const afterExpiry = issuedAt + 15 * 24 * 60 * 60 * 1000;
  assert.equal(verifySessionToken(token, afterExpiry), false);
});

test("session verification fails closed without a sufficiently long secret", () => {
  process.env.FUND_SESSION_SECRET = "short";
  assert.equal(verifySessionToken("1234567890.signature"), false);
});
