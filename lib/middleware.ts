import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./auth";

export interface AuthContext {
  clinicianId: string;
  email: string;
}

// Middleware to verify session token from Authorization header or cookies
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, auth: AuthContext) => Promise<Response>
): Promise<Response> {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.cookies.get("sessionToken")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized: No token provided" },
      { status: 401 }
    );
  }

  const auth = await verifySessionToken(token);

  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid token" },
      { status: 401 }
    );
  }

  return handler(req, auth);
}
