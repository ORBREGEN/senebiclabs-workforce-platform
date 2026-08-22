import { SignJWT, jwtVerify } from "jose";
import { supabaseAdmin } from "./supabase";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const MAGIC_LINK_SECRET = new TextEncoder().encode(
  process.env.MAGIC_LINK_SECRET!
);
const MAGIC_LINK_EXPIRY = parseInt(process.env.MAGIC_LINK_EXPIRY_HOURS || "24");

// Generate a magic link token
export async function generateMagicLink(email: string): Promise<string> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAGIC_LINK_EXPIRY}h`)
    .sign(MAGIC_LINK_SECRET);

  return token;
}

// Verify a magic link token
export async function verifyMagicLink(
  token: string
): Promise<{ email: string } | null> {
  try {
    const verified = await jwtVerify(token, MAGIC_LINK_SECRET);
    return { email: verified.payload.email as string };
  } catch {
    return null;
  }
}

// Create or get clinician, then create a session
export async function createOrGetClinician(email: string): Promise<string> {
  // Check if clinician exists
  const { data: existing, error: existError } = await supabaseAdmin
    .from("clinicians")
    .select("id")
    .eq("email", email)
    .single();

  if (existError && existError.code !== "PGRST116") {
    console.error("Error checking existing clinician:", existError);
    throw existError;
  }

  let clinicianId: string;

  if (existing) {
    clinicianId = existing.id;
  } else {
    // Create new clinician
    const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data: newClinician, error } = await supabaseAdmin
      .from("clinicians")
      .insert({
        email,
        name: email.split("@")[0],
        access_code: accessCode,
        active: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating clinician:", error);
      throw error;
    }
    clinicianId = newClinician.id;
  }

  // Create session token
  const sessionToken = await new SignJWT({ clinicianId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  // Store session in DB (optional, for audit) — idempotent
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: sessionError } = await supabaseAdmin.from("sessions").insert({
    clinician_id: clinicianId,
    token: sessionToken,
    expires_at: expiresAt,
  });

  // Ignore duplicate key errors (double-click on magic link)
  if (sessionError && sessionError.code !== "23505") {
    console.error("Error creating session:", sessionError);
    throw sessionError;
  }

  return sessionToken;
}

// Verify session token
export async function verifySessionToken(
  token: string
): Promise<{ clinicianId: string; email: string } | null> {
  try {
    const verified = await jwtVerify(token, SECRET);
    return {
      clinicianId: verified.payload.clinicianId as string,
      email: verified.payload.email as string,
    };
  } catch {
    return null;
  }
}
