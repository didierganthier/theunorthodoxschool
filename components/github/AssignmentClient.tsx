"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GithubConnectionStatus, GithubSubmission } from "@/lib/github/types";

interface Props {
  moduleSlug: string;
  lessonSlug: string;
  connectionStatus: GithubConnectionStatus;
  connectHref: string;
  initialSubmission: GithubSubmission | null;
  alreadyPassed: boolean;
}

const POLL_MS = 6000;

export default function AssignmentClient({
  connectionStatus,
  connectHref,
  initialSubmission,
  alreadyPassed,
}: Props) {
  const router = useRouter();
  const [submission, setSubmission] = useState<GithubSubmission | null>(initialSubmission);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passed = alreadyPassed || submission?.workflowStatus === "passed";
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/github/assignments/status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { submission: GithubSubmission | null };
      if (data.submission) {
        setSubmission(data.submission);
        if (data.submission.workflowStatus === "passed") {
          router.refresh();
        }
      }
    } catch {
      // Transient network error — keep the last known state.
    }
  }, [router]);

  // Poll while a submission exists and has not yet passed.
  useEffect(() => {
    if (!submission || passed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(refreshStatus, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [submission, passed, refreshStatus]);

  const startAssignment = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/github/assignments/start", { method: "POST" });
      const data = (await res.json()) as { submission?: GithubSubmission; message?: string };
      if (!res.ok || !data.submission) {
        setError(data.message ?? "We could not start the assignment. Please try again.");
        return;
      }
      setSubmission(data.submission);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setStarting(false);
    }
  }, []);

  // ── Disabled / honest states ───────────────────────────────────────────────
  if (connectionStatus === "unavailable") {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111111] p-6 text-sm leading-relaxed text-gray-400">
        This assignment will open shortly. Nothing is connected yet.
      </div>
    );
  }

  if (passed) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <p className="text-sm font-semibold text-emerald-300">✓ Assignment passed</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          Your submission passed all checks and this lesson is complete. Nice work.
        </p>
        {submission?.repositoryUrl && (
          <a
            href={submission.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-sm text-sm text-gray-400 underline underline-offset-4 hover:text-white"
          >
            View your repository →
          </a>
        )}
      </div>
    );
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
        <p className="text-sm leading-relaxed text-gray-300">
          First, connect your GitHub account. We will then create a private
          repository just for you.
        </p>
        <a
          href={connectHref}
          className="mt-5 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Connect GitHub
        </a>
      </div>
    );
  }

  // ── Connected, no submission yet ───────────────────────────────────────────
  if (!submission) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
        <p className="text-sm leading-relaxed text-gray-300">
          You are connected. Start the assignment to generate your private
          repository.
        </p>
        {error && <p className="mt-3 text-sm text-amber-300">{error}</p>}
        <button
          type="button"
          onClick={startAssignment}
          disabled={starting}
          className="mt-5 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60"
        >
          {starting ? "Creating your repository…" : "Start Assignment 00"}
        </button>
      </div>
    );
  }

  // ── Submission in progress ─────────────────────────────────────────────────
  const invitationPending =
    submission.repositoryStatus === "creating" && !submission.invitationAccepted;
  const failed = submission.workflowStatus === "failed";

  return (
    <div className="rounded-xl border border-white/10 bg-[#111111] p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-white">Your repository</p>
        <StatusPill submission={submission} />
      </div>

      {submission.repositoryUrl && (
        <a
          href={submission.repositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex rounded-sm text-sm text-gray-300 underline underline-offset-4 hover:text-white"
        >
          {submission.repositoryFullName ?? "Open repository"} →
        </a>
      )}

      {invitationPending && (
        <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          <p className="font-semibold">Accept your invitation</p>
          <p className="mt-1 leading-relaxed">
            We invited you as a collaborator. Accept the invitation, then this
            page will update automatically.
          </p>
          {submission.invitationUrl && (
            <a
              href={submission.invitationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex rounded-sm underline underline-offset-4 hover:text-amber-100"
            >
              Open the invitation →
            </a>
          )}
        </div>
      )}

      {!invitationPending && (
        <div className="mt-5 space-y-3 text-sm leading-relaxed text-gray-300">
          <p>
            Edit <code className="rounded bg-white/10 px-1.5 py-0.5">student/profile.json</code> in
            your repository with your details, then commit. The automated checks
            run within a minute.
          </p>
          <p className="text-gray-500">
            Only edit that one file. The grading files are protected — changing
            them will fail the check.
          </p>
        </div>
      )}

      {failed && (
        <p className="mt-4 text-sm text-amber-300">
          The last check did not pass. Review your changes to
          student/profile.json and commit again — we will re-check automatically.
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={refreshStatus}
          className="inline-flex items-center rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Check status now
        </button>
        <span className="text-xs text-gray-500">Auto-checking every few seconds…</span>
      </div>
    </div>
  );
}

function StatusPill({ submission }: { submission: GithubSubmission }) {
  let label = "In progress";
  let className = "border-white/10 text-gray-400";

  if (submission.repositoryStatus === "creating" && !submission.invitationAccepted) {
    label = "Invitation pending";
    className = "border-amber-500/30 text-amber-300";
  } else if (submission.workflowStatus === "running" || submission.workflowStatus === "pending") {
    label = "Checking…";
    className = "border-sky-500/30 text-sky-300";
  } else if (submission.workflowStatus === "failed") {
    label = "Needs changes";
    className = "border-amber-500/30 text-amber-300";
  } else if (submission.repositoryStatus === "error") {
    label = "Error";
    className = "border-red-500/30 text-red-300";
  } else if (submission.repositoryStatus === "ready") {
    label = "Ready";
    className = "border-emerald-500/30 text-emerald-300";
  }

  return (
    <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${className}`}>
      {label}
    </span>
  );
}
