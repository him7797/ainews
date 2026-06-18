import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";
import { loadConfig } from "./config.js";

const config = loadConfig();

// ── Token encryption (AES-256-GCM) ──────────────────────────────────────────

function getEncryptionKey(): Buffer {
  return Buffer.from(config.tokenEncryptionKey, "hex");
}

export function encryptToken(plain: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(stored: string): string {
  const [ivHex, authTagHex, encryptedHex] = stored.split(":");
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

// ── Google ID token verification ─────────────────────────────────────────────

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export class AuthError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function verifyGoogleIdToken(idToken: string): Promise<{ email: string }> {
  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: config.googleClientId,
    });
    payload = result.payload as Record<string, unknown>;
  } catch {
    throw new AuthError("invalid_id_token", "Google ID token verification failed");
  }

  if (payload.email_verified !== true) {
    throw new AuthError("email_not_verified", "Google account email must be verified");
  }

  return { email: payload.email as string };
}

// ── JWT sign / verify ────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(config.jwtSecret);
}

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function signJwt(userId: string, email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${THIRTY_DAYS_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyJwt(token: string): Promise<{ sub: string; email: string }> {
  const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
  return { sub: payload.sub as string, email: payload.email as string };
}
