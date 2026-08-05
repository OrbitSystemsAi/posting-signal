import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    return NextResponse.json({ error: "LinkedIn developer credentials are not configured" }, { status: 503 });
  }

  const state = randomBytes(32).toString("base64url");
  const redirectUri = new URL("/api/linkedin/callback", request.nextUrl.origin).toString();
  const authorizationUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizationUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email w_member_social",
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
