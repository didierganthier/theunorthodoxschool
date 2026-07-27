"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CheckpointField } from "@/lib/curriculum";

type Status = "idle" | "submitting" | "passed" | "error";

/**
 * Learning Goal checkpoint.
 *
 * Submits to the server for validation. The server is the source of truth for
 * pass/fail — the client never marks itself complete without a passing
 * response. When persistence is unavailable, the response says so honestly.
 */
export default function CheckpointLearningGoal({
  moduleSlug,
  lessonSlug,
  checkpointSlug,
  fields,
  initialValues,
  alreadyPassed,
}: {
  moduleSlug: string;
  lessonSlug: string;
  checkpointSlug: string;
  fields: CheckpointField[];
  initialValues?: Record<string, string>;
  alreadyPassed?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    () =>
      initialValues ??
      Object.fromEntries(fields.map((f) => [f.name, ""])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>(
    alreadyPassed ? "passed" : "idle",
  );
  const [notice, setNotice] = useState("");
  const [persisted, setPersisted] = useState(true);

  function validateLocal(): boolean {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (value.length < field.minLength) {
        next[field.name] =
          `Please write at least ${field.minLength} characters so this is useful to you later.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice("");
    if (!validateLocal()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/learn/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleSlug,
          lessonSlug,
          checkpointSlug,
          answers: values,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.passed) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setStatus("error");
        setNotice(
          data.message ?? "Some answers need a little more detail. Please review.",
        );
        return;
      }

      setPersisted(Boolean(data.persisted));
      setStatus("passed");
      if (!data.persisted) {
        // Honest interim: store on this device so the learner keeps their work.
        try {
          window.localStorage.setItem(
            `checkpoint:${moduleSlug}/${lessonSlug}`,
            JSON.stringify({ answers: values, passedAt: new Date().toISOString() }),
          );
        } catch {
          // ignore storage failures
        }
      } else {
        router.refresh();
      }
    } catch {
      setStatus("error");
      setNotice("Something went wrong submitting your answers. Please try again.");
    }
  }

  if (status === "passed") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <h3 className="text-lg font-bold text-emerald-200">
          Learning goal saved
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">
          Your goal will guide your work through the program. You can revisit and
          refine it anytime.
        </p>
        {!persisted && (
          <p className="mt-3 text-xs text-amber-200/90">
            Note: learner accounts are not connected yet, so this is saved only
            on this device for now. It is your real answer — not a completed
            status on the server.
          </p>
        )}
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-sm text-sm text-emerald-100 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Edit my answers
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {fields.map((field) => {
        const id = `cp-${field.name}`;
        const err = errors[field.name];
        return (
          <div key={field.name}>
            <label htmlFor={id} className="mb-2 block text-sm font-medium text-white">
              {field.label}
            </label>
            {field.multiline ? (
              <textarea
                id={id}
                name={field.name}
                rows={3}
                value={values[field.name] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.name]: e.target.value }))
                }
                placeholder={field.placeholder}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? `${id}-error` : undefined}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              />
            ) : (
              <input
                id={id}
                name={field.name}
                type="text"
                value={values[field.name] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.name]: e.target.value }))
                }
                placeholder={field.placeholder}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? `${id}-error` : undefined}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              />
            )}
            {err && (
              <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-400">
                {err}
              </p>
            )}
          </div>
        );
      })}

      {status === "error" && notice && (
        <p role="alert" className="text-sm text-red-400">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? "Checking…" : "Submit learning goal"}
      </button>
    </form>
  );
}
