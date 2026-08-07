import { siteConfig } from "@/lib/site-config";
import type { GithubConnectionStatus } from "@/lib/github/types";

/**
 * Shows the learner's GitHub connection state.
 *
 * Default is `unavailable` — we never show a fake connected account. When the
 * integration is live, `disconnected` shows a real Connect button that starts
 * the GitHub App web authorization flow.
 */
export default function GithubConnectionCard({
  status = "unavailable",
  username,
  connectHref = "/api/github/connect?next=/settings",
}: {
  status?: GithubConnectionStatus;
  username?: string;
  connectHref?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            GitHub
          </p>
          <h3 className="mt-2 text-lg font-bold text-white">
            Version control account
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === "connected" && username ? (
        <p className="mt-4 text-sm text-gray-400">
          Connected as <strong className="text-white">@{username}</strong>.
        </p>
      ) : status === "disconnected" ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Connect your GitHub account to start technical assignments.
          </p>
          <div className="mt-5">
            <a
              href={connectHref}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Connect GitHub
            </a>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-gray-400">
          GitHub connection will become available when technical assignments
          open. Nothing is connected yet.
        </p>
      )}

      <div className="mt-5">
        <a
          href={siteConfig.githubOrgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-sm text-sm text-gray-400 underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Visit the school on GitHub →
        </a>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GithubConnectionStatus }) {
  const map: Record<GithubConnectionStatus, { label: string; className: string }> =
    {
      unavailable: {
        label: "Not available yet",
        className: "border-white/10 text-gray-500",
      },
      disconnected: {
        label: "Not connected",
        className: "border-amber-500/30 text-amber-300",
      },
      connected: {
        label: "Connected",
        className: "border-emerald-500/30 text-emerald-300",
      },
    };
  const { label, className } = map[status];
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${className}`}
    >
      {label}
    </span>
  );
}
