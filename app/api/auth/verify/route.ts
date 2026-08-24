import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "@/lib/auth";
import { GATE_MESSAGE, signInOrReject } from "@/lib/auth-gate";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Exchanges a magic-link token for a session.
 *
 * Proving control of an address is not the same as being allowed in: the token
 * establishes the address, and the gate decides whether it may have an account.
 * An invite token may ride along when the link was opened from /join.
 */
export async function POST(req: NextRequest) {
  let token: string | undefined;
  let invite: string | null = null;

  try {
    const body = await req.json();
    token = body?.token;
    invite = typeof body?.invite === "string" ? body.invite : null;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  try {
    const magicLinkData = await verifyMagicLink(token);

    if (!magicLinkData) {
      return NextResponse.json(
        { error: "This link has expired or has already been used." },
        { status: 401 }
      );
    }

    const result = await signInOrReject(magicLinkData.email, invite);

    if (!result.ok) {
      return NextResponse.json(
        { error: GATE_MESSAGE[result.reason], reason: result.reason },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      email: result.email,
      created: result.created,
    });

    response.cookies.set(SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("[verify] failed", error);
    return NextResponse.json(
      { error: "We could not sign you in. Try again in a moment." },
      { status: 500 }
    );
  }
}
