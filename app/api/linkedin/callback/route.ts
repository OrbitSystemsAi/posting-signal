import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { socialConnections } from "@/db/schema";
import { env } from "@/lib/env";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { encryptToken } from "@/lib/token-crypto";

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string; refresh_token_expires_in?: number };
type UserInfo = { sub: string; name?: string; email?: string };

function matchesState(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const error = request.nextUrl.searchParams.get("error");
  if (error) return NextResponse.redirect(new URL(`/?linkedin=error&reason=${encodeURIComponent(error)}`, request.url));

  const code = request.nextUrl.searchParams.get("code") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  const expectedState = request.cookies.get("linkedin_oauth_state")?.value || "";
  if (!code || !state || !expectedState || !matchesState(state, expectedState)) {
    return NextResponse.json({ error: "Invalid LinkedIn OAuth state" }, { status: 401 });
  }
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    return NextResponse.json({ error: "LinkedIn developer credentials are not configured" }, { status: 503 });
  }

  const redirectUri = new URL("/api/linkedin/callback", request.nextUrl.origin).toString();
  const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
    }),
  });
  if (!tokenResponse.ok) return NextResponse.json({ error: "LinkedIn token exchange failed" }, { status: 502 });
  const token = (await tokenResponse.json()) as TokenResponse;

  const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!profileResponse.ok) return NextResponse.json({ error: "LinkedIn profile lookup failed" }, { status: 502 });
  const profile = (await profileResponse.json()) as UserInfo;
  const context = await requireCurrentWorkspace();
  if (!context) return NextResponse.json({ error: "Database workspace is unavailable" }, { status: 503 });

  const values = {
    workspaceId: context.workspace.id,
    platform: "linkedin" as const,
    externalAccountId: profile.sub,
    displayName: profile.name || profile.email || "LinkedIn member",
    encryptedAccessToken: encryptToken(token.access_token),
    encryptedRefreshToken: token.refresh_token ? encryptToken(token.refresh_token) : null,
    scopes: ["openid", "profile", "email", "w_member_social"],
    expiresAt: new Date(Date.now() + token.expires_in * 1000),
    active: true,
    updatedAt: new Date(),
  };
  const [existing] = await context.db.select({ id: socialConnections.id }).from(socialConnections).where(and(
    eq(socialConnections.workspaceId, context.workspace.id),
    eq(socialConnections.platform, "linkedin"),
    eq(socialConnections.externalAccountId, profile.sub),
  )).limit(1);
  if (existing) await context.db.update(socialConnections).set(values).where(eq(socialConnections.id, existing.id));
  else await context.db.insert(socialConnections).values(values);

  const response = NextResponse.redirect(new URL("/?linkedin=connected", request.url));
  response.cookies.delete("linkedin_oauth_state");
  return response;
}
