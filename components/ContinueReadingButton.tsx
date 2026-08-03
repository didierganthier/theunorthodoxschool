"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "submitting" | "error";

/**
 * Completion control for a *reading* lesson (no interactive checkpoint).
 *
 * The learner confirms they have read the lesson, which records completion on
 * the server and unlocks the next lesson. If the lesson is already completed,
 * a plain "Continue" link is shown instead.
 */
export default function ContinueReadingButton({
  moduleSlug,
  lessonSlug,
  nextHref,
  alreadyCompleted,
}: {
  moduleSlug: string;
  lessonSlug: string;
  nextHref: string;
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  if (alreadyCompleted) {
    return (
      <div className="mt-6">
        <p className="text-sm text-emerald-300">✓ You have completed this lesson.</p>
        <Link
          href={nextHref}
          className="mt-4 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Continue →
        </Link>
      </div>
    );
  }

  async function handleComplete() {
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/learn/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug, lessonSlug }),
      });
      const data = (await res.json()) as {
        completed?: boolean;
        message?: string;
      };

      if (!res.ok || !data.completed) {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(nextHref);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleComplete}
        disabled={status === "submitting"}
        className="inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Saving…" : "I've read this — continue →"}
      </button>
      {status === "error" && message && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
