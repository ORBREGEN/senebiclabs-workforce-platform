import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { supabaseAdmin } from "@/lib/supabase";
import {
  INVITE_TTL_DAYS,
  newInviteToken,
  normalizeEmail,
} from "@/lib/invites";
import { sendInviteEmail } from "@/lib/send-invite";

export const dynamic = "force-dynamic";

/**
 * Issues an invite.
 *
 * Two ways to be allowed: a clinician whose `can_invite` is set, or the
 * operator key. The flag is the durable mechanism — granting it to a member
 * turns the in-app invite UI on for them with no deploy — and the operator key
 * is how the first clinicians get invited before any member holds the flag.
 */

const looksLikeEmail = (v: string) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v);

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

  if (!looksLikeEmail(email)) {
    return NextResponse.json(
      { error: "That does not look like an email address." },
      { status: 400 }
    );
  }

  // Already a member: an invite would be a dead link.
  const { data: existing } = await supabaseAdmin
    .from("clinicians")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "That address already has an account." },
      { status: 409 }
    );
  }

  const token = newInviteToken();
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: invite, error } = await supabaseAdmin
    .from("invites")
    .insert({
      token,
      invited_email: email,
      invited_by: inviter.inviterId,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id, token, invited_email, expires_at")
    .single();

  if (error) {
    // The partial unique index means one live invite per address.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That address already has an invite waiting." },
        { status: 409 }
      );
    }
    console.error("[invites] insert failed", error);
    return NextResponse.json(
      { error: "We could not create that invite." },
      { status: 500 }
    );
  }

  // The invite is worthless if the link never arrives, so a failed send is a
  // failed invite — and the row is withdrawn rather than left blocking a retry.
  try {
    await sendInviteEmail(email, invite.token, inviter.inviterName);
  } catch (err) {
    console.error("[invites] send failed", err);
    await supabaseAdmin
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", invite.id);
    return NextResponse.json(
      { error: "We could not send that invite. Try again in a moment." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    invited_email: invite.invited_email,
    expires_at: invite.expires_at,
    sent: true,
  });
}
