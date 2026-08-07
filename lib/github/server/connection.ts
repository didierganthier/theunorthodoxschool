import "server-only";

import { getGithubConfig } from "../config";
import { createClient } from "@/lib/supabase/server";
import type { GithubConnectionStatus } from "../types";

export interface GithubConnection {
  status: GithubConnectionStatus;
  username: string | null;
  avatarUrl: string | null;
}

/**
 * Resolves the learner's GitHub connection state for UI.
 *
 * "unavailable" when the integration is not configured (honest disabled state),
 * "connected" when a linked account exists, otherwise "disconnected".
 */
export async function getGithubConnection(
  userId: string | null,
): Promise<GithubConnection> {
  if (!getGithubConfig()) {
    return { status: "unavailable", username: null, avatarUrl: null };
  }
  if (!userId) {
    return { status: "disconnected", username: null, avatarUrl: null };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "unavailable", username: null, avatarUrl: null };
  }

  const { data } = await supabase
    .from("github_accounts")
    .select("github_username, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.github_username) {
    return {
      status: "connected",
      username: data.github_username as string,
      avatarUrl: (data.avatar_url as string | null) ?? null,
    };
  }
  return { status: "disconnected", username: null, avatarUrl: null };
}
