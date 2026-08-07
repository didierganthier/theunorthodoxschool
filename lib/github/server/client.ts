import "server-only";

import { App, Octokit } from "octokit";
import { getGithubConfig } from "../config";

/**
 * Returns an Octokit authenticated as the org INSTALLATION, or null when the
 * integration is not configured. Installation tokens are used for every
 * privileged operation (repo generation, collaborator invitation, reading
 * commits/trees for verification) and are automatically scoped to the repos the
 * installation can access.
 */
export async function getInstallationOctokit(): Promise<Octokit | null> {
  const cfg = getGithubConfig();
  if (!cfg) return null;

  const app = new App({ appId: cfg.appId, privateKey: cfg.privateKey });
  return app.getInstallationOctokit(cfg.installationId);
}
