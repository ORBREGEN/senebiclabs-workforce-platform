import { NextRequest, NextResponse } from "next/server";
import { generateMagicLink } from "@/lib/auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@senebiclabs.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendMagicLinkEmail(email: string, magicLinkUrl: string) {
  if (!RESEND_API_KEY) {
    // In development the link comes back in the response, so there is still a
    // way in. In production there is not: an unconfigured key must fail loudly
    // rather than look like a sent email.
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.warn("RESEND_API_KEY not set — skipping email (development only)");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "Your Senebiclabs Magic Link",
        html: `
          <h2>Welcome to Senebiclabs</h2>
          <p>Click the link below to sign in to your account:</p>
          <a href="${APP_URL}${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Sign In
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
          </p>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
      throw new Error("Failed to send email");
    }

    return true;
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  try {
    const magicLinkToken = await generateMagicLink(email);
    const magicLinkUrl = `/auth/verify?token=${magicLinkToken}`;

    // If the email does not go out, say so. Reporting success here would show
    // a clinician "check your email" for a message that was never sent, and
    // lock them out with no error anywhere for anyone to see.
    try {
      await sendMagicLinkEmail(email, magicLinkUrl);
    } catch (emailError) {
      console.error("[magic-link] send failed:", emailError);
      return NextResponse.json(
        {
          error:
            "We could not send your sign-in link. Please try again in a moment, or contact support if it keeps happening.",
        },
        { status: 502 }
      );
    }

    // For development, still return the link in response
    if (process.env.NODE_ENV === "development") {
      console.log(`✉️  Magic link for ${email}:`);
      console.log(`${APP_URL}${magicLinkUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent to email",
      magicLink:
        process.env.NODE_ENV === "development" ? magicLinkUrl : undefined,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

