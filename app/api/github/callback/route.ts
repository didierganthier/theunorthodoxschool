import { NextResponse, type NextRequest } from "next/server";
import { getGithubConfig } from "@/lib/github/config";
import { exchangeCodeForIdentity } from "@/lib/github/server/oauth";
import { verifyOauthState } from "@/lib/github/oauth-state";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STATE_COOKIE = "gh_oauth_state";
const NEXT_COOKIE = "gh_oauth_next";

function redirectWith(request: NextRequest, path: string, status: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("github", status);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NEXT_COOKIE);
  return response;
}

/**
 * GitHub App web-authorization callback.
 *
 * Validates the signed state against the cookie nonce, exchanges the code for a
 * short-lived user token, fetches the authenticated identity, persists the
 * numeric id / login / avatar, and discards the token.
 */
export async function GET(request: NextRequest) {
  const cfg = getGithubConfig();
  const next = request.cookies.get(NEXT_COOKIE)?.value ?? "/settings";

  if (!cfg) {
    return redirectWith(request, "/settings", "unavailable");
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/settings", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieNonce = request.cookies.get(STATE_COOKIE)?.value ?? null;

  if (!code || !verifyOauthState(state, cookieNonce, cfg.clientSecret)) {
    return redirectWith(request, next, "error");
  }

  const identity = await exchangeCodeForIdentity(cfg, code);
  if (!identity) {
    return redirectWith(request, next, "error");
  }

  const supabase = await createClient();
  if (!supabase) {
    return redirectWith(request, next, "error");
  }

  const { error } = await supabase.from("github_accounts").upsert(
    {
      user_id: user.id,
      github_user_id: identity.id,
      github_username: identity.login,
      avatar_url: identity.avatarUrl,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return redirectWith(request, next, "error");
  }

  return redirectWith(request, next, "connected");
}
