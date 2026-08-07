import { NextResponse, type NextRequest } from "next/server";
import { getGithubConfig } from "@/lib/github/config";
import { buildAuthorizeUrl } from "@/lib/github/server/oauth";
import { createOauthState } from "@/lib/github/oauth-state";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STATE_COOKIE = "gh_oauth_state";
const NEXT_COOKIE = "gh_oauth_next";

/**
 * Starts the GitHub App web authorization flow.
 *
 * Requires an authenticated learner. Generates a signed CSRF state, stores the
 * matching nonce in an httpOnly cookie (double-submit), and redirects to GitHub.
 * Honest 503 when the integration is not configured — no fake flow.
 */
export async function GET(request: NextRequest) {
  const cfg = getGithubConfig();
  if (!cfg) {
    return NextResponse.json(
      { status: "unavailable", message: "GitHub connection is not available yet." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/settings", request.url));
  }

  const { token, nonce } = createOauthState(cfg.clientSecret);
  const authorizeUrl = buildAuthorizeUrl(cfg, token);

  // Only allow same-site relative redirect targets after the flow completes.
  const nextParam = request.nextUrl.searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") ? nextParam : "/settings";

  const response = NextResponse.redirect(authorizeUrl);
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(STATE_COOKIE, nonce, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  response.cookies.set(NEXT_COOKIE, safeNext, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
