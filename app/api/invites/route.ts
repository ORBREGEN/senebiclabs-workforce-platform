import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { supabaseAdmin } from "@/lib/supabase";
import { createAndSendInvite, normalizeEmail } from "@/lib/invites";

export const dynamic = "force-dynamic";

/**
 * Issues an invite.
 *
 * Two ways to be allowed: a clinician whose `can_invite` is set, or the
 * operator key. The flag is the durable mechanism — granting it to a member
 * turns the in-app invite UI on for them with no deploy — and the operator key
 * is how the first clinicians get invited before any member holds the flag.
 */

async function resolveInviter(req: NextRequest): Promise<
  | { ok: true; inviterId: string | null; inviterName: string }
  | { ok: false; status: number; error: string }
> {
  const opsKey = process.env.OPS_API_KEY;
  const presented =
    req.headers.get("x-ops-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (opsKey && presented === opsKey) {
    return { ok: true, inviterId: null, inviterName: "Senebiclabs" };
  }

  // Otherwise it must be a signed-in clinician who holds the permission.
  const sessionToken =
    req.cookies.get(SESSION_COOKIE)?.value ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const auth = sessionToken ? await verifySessionToken(sessionToken) : null;
  if (!auth) {
    return { ok: false, status: 401, error: "Sign in to invite a colleague." };
  }

  const { data } = await supabaseAdmin
    .from("clinicians")
    .select("id, name, can_invite")
    .eq("id", auth.clinicianId)
    .maybeSingle();

  if (!data?.can_invite) {
    return {
      ok: false,
      status: 403,
      error: "You do not have permission to invite colleagues.",
    };
  }

  return {
    ok: true,
    inviterId: data.id as string,
    inviterName: (data.name as string) || "A colleague",
  };
}

export async function POST(req: NextRequest) {
  const inviter = await resolveInviter(req);
  if (!inviter.ok) {
    return NextResponse.json({ error: inviter.error }, { status: inviter.status });
  }

  let email: string;
  try {
    const body = await req.json();
    email = normalizeEmail(String(body?.email ?? ""));
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const created = await createAndSendInvite(
    email,
    inviter.inviterId,
    inviter.inviterName
  );

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status });
  }

  const invite = created.invite;

  return NextResponse.json({
    invited_email: invite.invited_email,
    expires_at: invite.expires_at,
    sent: true,
  });
}
