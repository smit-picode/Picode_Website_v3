import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypts small secrets (e.g. the SMTP password) before they're written to the data
 * store. AES-256-GCM with a key derived from ADMIN_SESSION_SECRET, so the stored value
 * is useless without the server's env. Format: v1.<iv>.<tag>.<ciphertext> (base64url).
 */
function key() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set to store secrets.");
  return createHash("sha256").update(`picode:secret-box:${secret}`).digest();
}

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

/** Returns null if the value can't be decrypted (e.g. the secret changed). */
export function open(sealed: string): string | null {
  try {
    const [v, iv, tag, data] = sealed.split(".");
    if (v !== "v1" || !iv || !tag || !data) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
