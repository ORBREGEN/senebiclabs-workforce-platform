import { NextRequest, NextResponse } from "next/server";

/** Clears the session cookie. The cookie is httpOnly, so only the server can. */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sessionToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
