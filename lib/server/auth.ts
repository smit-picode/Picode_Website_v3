import "server-only";

import { scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/**
 * ADMIN_PASSWORD_HASH format: `scrypt.<saltBase64url>.<hashBase64url>`
 * Generate one with: `npm run admin:hash -- "<password>"`
 */
export async function verifyPassword(password: string, stored: string) {
  const [algo, saltB64, hashB64] = stored.split(".");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64url"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function safeEqualText(a: string, b: string) {
  const ab = Buffer.from(a.trim().toLowerCase());
  const bb = Buffer.from(b.trim().toLowerCase());
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function checkAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) {
    console.error("[auth] ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not configured.");
    return false;
  }
  // Always run the hash so timing doesn't reveal whether the email matched.
  const passwordOk = await verifyPassword(password, adminHash);
  return safeEqualText(email, adminEmail) && passwordOk;
}

export async function startAdminSession(email: string) {
  const token = await createSessionToken(email);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function endAdminSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getAdminSession() {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin page and server action (defence in depth). */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
