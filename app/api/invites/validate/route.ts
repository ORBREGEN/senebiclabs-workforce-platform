import { NextRequest, NextResponse } from "next/server";
import { loadInvite, inviterName } from "@/lib/invites";

export const dynamic = "force-dynamic";

/**
 * Tells the join page whether a token is worth showing a form for.
 *
 * Deliberately thin: it reveals the invited address and who invited them —
 * which the holder of the link already knows — and nothing else about the
 * platform or its members.
 */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const { invite, problem } = await loadInvite(token);

  if (problem || !invite) {
    return NextResponse.json({ valid: false, problem: problem ?? "not_found" });
  }

  return NextResponse.json({
    valid: true,
    invited_email: invite.invited_email,
    inviter: await inviterName(invite.invited_by),
    expires_at: invite.expires_at,
  });
}
