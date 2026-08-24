import "server-only";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";

/**
 * Google sign-in, as a plain OAuth2 code flow.
 *
 * Rolled directly rather than through an auth library so both sign-in methods
 * end at the same gate and issue the same session cookie. A second library
 * would bring its own session and its own idea of who may hold an account,
 * which is exactly the thing invite-only access cannot afford.
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const STATE_SECRET = new TextEncoder().encode(
  process.env.MAGIC_LINK_SECRET || process.env.JWT_SECRET || "dev"
);

export const GOOGLE_REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;

export const googleConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

/**
 * Signed state, carrying the invite token through the round trip.
 *
 * Signing it means Google cannot be used to smuggle an arbitrary invite token
 * back into the callback, and it doubles as CSRF protection.
 */
export async function buildState(inviteToken?: string | null): Promise<string> {
  return new SignJWT({ invite: inviteToken ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(STATE_SECRET);
}

export async function readState(
  state: string
): Promise<{ invite: string | null } | null> {
  try {
    const { payload } = await jwtVerify(state, STATE_SECRET);
    return { invite: (payload.invite as string | null) ?? null };
  } catch {
    return null;
  }
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    // Always show the chooser: a shared machine must not silently reuse an account.
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export interface GoogleIdentity {
  email: string;
  emailVerified: boolean;
  name: string | null;
}

/** Exchanges the code and verifies the returned id_token against Google's keys. */
export async function exchangeCode(code: string): Promise<GoogleIdentity> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }

  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google returned no id_token");

  const { payload } = await jwtVerify(id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: CLIENT_ID,
  });

  const email = payload.email as string | undefined;
  if (!email) throw new Error("Google returned no email");

  return {
    email,
    emailVerified: payload.email_verified === true,
    name: (payload.name as string | undefined) ?? null,
  };
}
