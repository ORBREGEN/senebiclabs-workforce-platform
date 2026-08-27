import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Walls off the operator console at the edge.
 *
 * /ops is not part of the clinician application and shares nothing with it. A
 * clinician session is never consulted here, so no amount of privilege inside
 * the clinician app reaches this. Only the unlock screen is public, and it
 * reveals nothing.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/ops/unlock") return NextResponse.next();

  const token = req.cookies.get("ops_session")?.value;
  const configured = Boolean(process.env.OPS_API_KEY);

  if (token && configured) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET ?? "missing-jwt-secret")
      );
      if (payload.ops === true) return NextResponse.next();
    } catch {
      /* fall through to the refusal */
    }
  }

  // A refusal, not a redirect: nothing here should hint at what it guards.
  return new NextResponse(
    JSON.stringify({ error: "Not authorised." }),
    { status: 403, headers: { "content-type": "application/json" } }
  );
}

export const config = { matcher: ["/ops", "/ops/:path*"] };
