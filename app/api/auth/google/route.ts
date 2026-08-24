import { NextRequest, NextResponse } from "next/server";
import { authorizeUrl, buildState, googleConfigured } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

/** Starts Google sign-in, carrying any invite token through signed state. */
export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_unavailable", req.url)
    );
  }

  const invite = new URL(req.url).searchParams.get("invite");
  return NextResponse.redirect(authorizeUrl(await buildState(invite)));
}
