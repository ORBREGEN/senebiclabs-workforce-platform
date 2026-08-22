import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink, createOrGetClinician } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 400 }
    );
  }

  try {
    const magicLinkData = await verifyMagicLink(token);

    if (!magicLinkData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Create or get clinician and create session
    const sessionToken = await createOrGetClinician(magicLinkData.email);

    // Create response with session token
    const response = NextResponse.json({
      success: true,
      sessionToken,
      email: magicLinkData.email,
    });

    // Set httpOnly cookie for session
    response.cookies.set("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: `Failed to verify token: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
