import { NextRequest, NextResponse } from "next/server";
import { withOps } from "@/lib/ops-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Withdraws a pending invite.
 *
 * The row is marked revoked rather than deleted, so the record of having
 * invited someone survives. The gate treats revoked as unusable, so the link
 * stops working immediately even though the email cannot be recalled.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOps(req, async () => {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id, invited_email, status");

    if (error) {
      console.error("[ops] invite revoke failed", error);
      return NextResponse.json({ error: "That did not save." }, { status: 500 });
    }
    if (!data?.length) {
      return NextResponse.json(
        { error: "That invite is not pending — it may already be used or revoked." },
        { status: 409 }
      );
    }

    return NextResponse.json({ invite: data[0] });
  });
}
