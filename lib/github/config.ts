import "server-only";

/**
 * Server-only GitHub App configuration.
 *
 * Reads and validates the environment. NONE of these values may be exposed to
 * the browser (no `NEXT_PUBLIC_` prefixes). The integration stays dormant until
 * `GITHUB_APP_ENABLED === "true"` AND all required values are present, so the
 * feature is safe to ship before the App is configured.
 */

export interface GithubConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  /** PEM private key with real newlines. */
  privateKey: string;
  installationId: number;
  webhookSecret: string;
  org: string;
  /** "owner/repo" of the frozen template. */
  templateFullName: string;
  templateOwner: string;
  templateRepo: string;
  /** Public site origin, used to build OAuth redirect + repo links. */
  siteUrl: string;
}

/** Feature flag: the integration is only live when explicitly enabled. */
export function isGithubAppEnabled(): boolean {
  return process.env.GITHUB_APP_ENABLED === "true";
}

/**
 * GitHub App private keys are often stored with escaped "\n" sequences in a
 * single-line env var. Normalize them back to real newlines for signing.
 */
function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim();
  // Support base64-encoded PEMs as well (no PEM header after decode check).
  if (!trimmed.includes("BEGIN") && /^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf8");
      if (decoded.includes("BEGIN")) return decoded;
    } catch {
      // fall through
    }
  }
  return trimmed.replace(/\\n/g, "\n");
}

/**
 * Returns the validated config, or null when the integration is disabled or any
 * required value is missing. Never throws, so callers can respond with an
 * honest "unavailable" state.
 */
export function getGithubConfig(): GithubConfig | null {
  if (!isGithubAppEnabled()) return null;

  const appId = process.env.GITHUB_APP_ID ?? "";
  const clientId = process.env.GITHUB_APP_CLIENT_ID ?? "";
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET ?? "";
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY ?? "";
  const installationIdRaw = process.env.GITHUB_APP_INSTALLATION_ID ?? "";
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
  const org = (process.env.GITHUB_ORG ?? "").trim();
  const templateFullName = (process.env.GITHUB_ASSIGNMENT00_TEMPLATE ?? "").trim();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.theunorthodoxschool.com"
  ).replace(/\/$/, "");

  const installationId = Number(installationIdRaw);
  const [templateOwner, templateRepo] = templateFullName.split("/");

  if (
    !appId ||
    !clientId ||
    !clientSecret ||
    !privateKeyRaw ||
    !Number.isFinite(installationId) ||
    installationId <= 0 ||
    !webhookSecret ||
    !org ||
    !templateOwner ||
    !templateRepo
  ) {
    return null;
  }

  return {
    appId,
    clientId,
    clientSecret,
    privateKey: normalizePrivateKey(privateKeyRaw),
    installationId,
    webhookSecret,
    org,
    templateFullName,
    templateOwner,
    templateRepo,
    siteUrl,
  };
}
