import "server-only";

import { Octokit } from "octokit";
import type { GithubConfig } from "../config";

export interface GithubIdentity {
  id: string;
  login: string;
  avatarUrl: string | null;
}

/**
 * Builds the GitHub App user-authorization URL. This is the standard web
 * authorization flow (NOT installation). The signed `state` protects against
 * CSRF; the nonce is also stored in an httpOnly cookie (double-submit).
 */
export function buildAuthorizeUrl(cfg: GithubConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: `${cfg.siteUrl}/api/github/callback`,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchanges the authorization code for a short-lived user token, fetches the
 * authenticated identity, then discards the token (we only persist the numeric
 * id, login and avatar). Returns null on any failure.
 */
export async function exchangeCodeForIdentity(
  cfg: GithubConfig,
  code: string,
): Promise<GithubIdentity | null> {
  let accessToken: string;
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: `${cfg.siteUrl}/api/github/callback`,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; error?: string };
    if (!data.access_token) return null;
    accessToken = data.access_token;
  } catch {
    return null;
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    const me = await octokit.rest.users.getAuthenticated();
    return {
      id: String(me.data.id),
      login: me.data.login,
      avatarUrl: me.data.avatar_url ?? null,
    };
  } catch {
    return null;
  }
  // The user token intentionally goes out of scope here and is never persisted.
}
