import "server-only";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "./supabase";
import { sendInviteEmail } from "./send-invite";

/**
 * Invites.
 *
 * An invite names one address, is spent once, and expires. It is also the
 * record of who vouched for whom — `invited_by` survives on the clinician row
 * after the invite is consumed.
 */

export const INVITE_TTL_DAYS = 7;

export interface Invite {
  id: string;
  token: string;
  invited_email: string;
  invited_by: string | null;
  status: "pending" | "accepted" | "expired" | "revoked";
  created_at: string;
  expires_at: string | null;
  accepted_by: string | null;
}

/** Addresses are compared case-insensitively everywhere. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function newInviteToken(): string {
  // 32 bytes of urlsafe randomness — not guessable, and short enough for a link.
  return randomBytes(32).toString("base64url");
}

export type InviteProblem = "not_found" | "used" | "expired" | "revoked";

/**
 * Looks an invite up by token and says whether it may still be spent.
 *
 * Expiry is evaluated here rather than trusted from `status`, so an invite that
 * has simply aged out is treated as expired without needing a sweeper job.
 */
export async function loadInvite(
  token: string
): Promise<{ invite: Invite; problem: null } | { invite: Invite | null; problem: InviteProblem }> {
  if (!token) return { invite: null, problem: "not_found" };

  const { data } = await supabaseAdmin
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  const invite = data as Invite | null;
  if (!invite) return { invite: null, problem: "not_found" };

  if (invite.status === "accepted") return { invite, problem: "used" };
  if (invite.status === "revoked") return { invite, problem: "revoked" };
  if (invite.status === "expired") return { invite, problem: "expired" };

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { invite, problem: "expired" };
  }

  return { invite, problem: null };
}

/** A live invite for this address, whatever token it was issued under. */
export async function findPendingInviteForEmail(
  email: string
): Promise<Invite | null> {
  const { data } = await supabaseAdmin
    .from("invites")
    .select("*")
    .eq("invited_email", normalizeEmail(email))
    .eq("status", "pending")
    .maybeSingle();

  const invite = data as Invite | null;
  if (!invite) return null;

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return null;
  }
  return invite;
}

/**
 * Marks an invite spent.
 *
 * Conditional on the row still being pending, so two sign-ins racing the same
 * invite cannot both consume it — the loser gets false and is refused.
 */
export async function consumeInvite(
  inviteId: string,
  clinicianId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("invites")
    .update({ status: "accepted", accepted_by: clinicianId })
    .eq("id", inviteId)
    .eq("status", "pending")
    .select("id");

  return (data?.length ?? 0) > 0;
}

/** The inviter's display name, for the join page. Never their email. */
export async function inviterName(invitedBy: string | null): Promise<string | null> {
  if (!invitedBy) return null;
  const { data } = await supabaseAdmin
    .from("clinicians")
    .select("name")
    .eq("id", invitedBy)
    .maybeSingle();
  return (data?.name as string | undefined) ?? null;
}

export type InviteFailure =
  | { ok: false; status: number; error: string };

/**
 * Creates a single-use invite and emails the link.
 *
 * The one implementation behind both the clinician-facing endpoint and /ops, so
 * an invite issued by an operator is the same object, with the same expiry and
 * the same email, as one issued by a colleague.
 *
 * A send failure withdraws the invite: an invite whose link never arrived is
 * worse than none, because the partial unique index would block a retry to the
 * same address.
 */
export async function createAndSendInvite(
  email: string,
  inviterId: string | null,
  inviterName: string
): Promise<
  | { ok: true; invite: { id: string; invited_email: string; expires_at: string | null; token: string } }
  | InviteFailure
> {
  const address = normalizeEmail(email);

  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(address)) {
    return { ok: false, status: 400, error: "That does not look like an email address." };
  }

  const { data: existing } = await supabaseAdmin
    .from("clinicians")
    .select("id")
    .ilike("email", address)
    .maybeSingle();

  if (existing) {
    return { ok: false, status: 409, error: "That address already has an account." };
  }

  const token = newInviteToken();
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: invite, error } = await supabaseAdmin
    .from("invites")
    .insert({
      token,
      invited_email: address,
      invited_by: inviterId,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id, token, invited_email, expires_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, status: 409, error: "That address already has an invite waiting." };
    }
    console.error("[invites] insert failed", error);
    return { ok: false, status: 500, error: "We could not create that invite." };
  }

  try {
    await sendInviteEmail(address, invite.token, inviterName);
  } catch (err) {
    console.error("[invites] send failed", err);
    await supabaseAdmin.from("invites").update({ status: "revoked" }).eq("id", invite.id);
    return { ok: false, status: 502, error: "We could not send that invite. Try again in a moment." };
  }

  return { ok: true, invite };
}
