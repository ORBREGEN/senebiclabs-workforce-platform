import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Applications from the public landing page.
 *
 * An application is a request to be considered, never a route in. It creates no
 * account and grants nothing: an operator reads it and decides whether to send
 * an invite, and the invite remains the only way anyone reaches the platform.
 *
 * TODO (ops wiring pending): applications land in the table and nothing tells
 * anyone they arrived. Before this is announced anywhere, either surface them
 * as a section in /ops or notify an operator on arrival. Until then someone has
 * to look.
 */

const MAX = 200;
const looksLikeEmail = (v: string) => /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v);

interface Application {
  full_name: string;
  email: string;
  specialty: string;
  credential: string;
  country: string;
}

function readApplication(body: unknown):
  | { ok: true; value: Application }
  | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const text = (key: string) => String(b[key] ?? "").trim().slice(0, MAX);

  const value: Application = {
    full_name: text("full_name"),
    email: text("email").toLowerCase(),
    specialty: text("specialty"),
    credential: text("credential"),
    country: text("country"),
  };

  if (!value.full_name) return { ok: false, error: "Please give your full name." };
  if (!looksLikeEmail(value.email)) {
    return { ok: false, error: "Please give an email address we can reach you at." };
  }
  if (!value.specialty) return { ok: false, error: "Please tell us your specialty." };
  if (!value.credential) return { ok: false, error: "Please tell us your credential." };
  if (!value.country) return { ok: false, error: "Please tell us where you practise." };

  return { ok: true, value };
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = readApplication(await req.json());
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  const application = parsed.value;

  const { error } = await supabaseAdmin.from("applications").insert(application);

  if (error) {
    // An application that is not stored has not been received. Saying otherwise
    // would leave a clinician waiting on a reply that can never come, so the
    // details are logged for recovery and the failure is reported honestly.
    console.error(
      "[apply] could not store an application. Run migration 007. Details:",
      JSON.stringify(application),
      error.message
    );
    return NextResponse.json(
      {
        error:
          "We could not record your application just now. Please try again shortly, or write to hello@senebiclabs.com.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ received: true });
}
