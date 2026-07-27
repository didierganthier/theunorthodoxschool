import type { AssignmentStatus } from "@/lib/github/types";

/**
 * Displays a single automated assignment and its grading state.
 *
 * Sprint 1 default is `not-started` with the action disabled, because grading
 * is not live. We never render a fake "passed" state.
 */
export default function AssignmentCard({
  title,
  description,
  status = "not-started",
  disabled = true,
}: {
  title: string;
  description: string;
  status?: AssignmentStatus;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">{description}</p>

      <button
        type="button"
        disabled={disabled}
        className="mt-5 inline-flex rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {disabled ? "Opens later" : "Start assignment"}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const map: Record<AssignmentStatus, { label: string; className: string }> = {
    "not-started": {
      label: "Not started",
      className: "border-white/10 text-gray-500",
    },
    pending: {
      label: "Queued",
      className: "border-sky-500/30 text-sky-300",
    },
    running: {
      label: "Running",
      className: "border-sky-500/30 text-sky-300",
    },
    failed: {
      label: "Needs work",
      className: "border-red-500/30 text-red-300",
    },
    passed: {
      label: "Passed",
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
