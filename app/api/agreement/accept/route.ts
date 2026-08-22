import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";

const CURRENT_AGREEMENT_VERSION = "1.0";

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    const { accepted } = await req.json();

    if (!accepted) {
      return NextResponse.json(
        { error: "You must accept the agreement to continue" },
        { status: 400 }
      );
    }

    try {
      // Record acceptance
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip") ||
        "unknown";

      const { error } = await supabaseAdmin
        .from("agreement_acceptances")
        .insert({
          clinician_id: auth.clinicianId,
          version: CURRENT_AGREEMENT_VERSION,
          ip: clientIp,
        });

      if (error && error.code !== "23505") {
        // 23505 = unique violation (already accepted)
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: "Agreement accepted",
      });
    } catch (error) {
      console.error("Agreement acceptance error:", error);
      return NextResponse.json(
        { error: "Failed to accept agreement" },
        { status: 500 }
      );
    }
  });
}

// Check if clinician has accepted current agreement
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    try {
      const { data: acceptance, error } = await supabaseAdmin
        .from("agreement_acceptances")
        .select("*")
        .eq("clinician_id", auth.clinicianId)
        .eq("version", CURRENT_AGREEMENT_VERSION)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found (expected)
        throw error;
      }

      return NextResponse.json({
        accepted: !!acceptance,
        version: CURRENT_AGREEMENT_VERSION,
      });
    } catch (error) {
      console.error("Agreement check error:", error);
      return NextResponse.json(
        { error: "Failed to check agreement" },
        { status: 500 }
      );
    }
  });
}
