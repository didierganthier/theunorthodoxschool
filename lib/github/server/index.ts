import "server-only";

/**
 * Server-only home for future GitHub API code.
 *
 * Anything importing this module can never be bundled into client components
 * (enforced by the `server-only` package). The real GitHub App client,
 * webhook verification, and repository provisioning will live here in a later
 * sprint.
 *
 * Sprint 1 intentionally contains NO live GitHub calls and NO fake success.
 */

export const GITHUB_SERVER_PLACEHOLDER = true;
