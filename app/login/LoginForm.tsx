"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/lib/site-config";

type Status = "idle" | "loading" | "sent" | "error";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Authentication is not available yet. Please check back soon.");
      return;
    }

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    const redirectTo = `${siteConfig.url}/auth/callback?next=${encodeURIComponent(
      nextPath,
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
        <p className="mb-4 text-3xl" aria-hidden>
          ✉
        </p>
        <h2 className="text-xl font-bold text-white">Check your email</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          We sent a secure sign-in link to <strong>{email}</strong>. Open it on
          this device to continue to your dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm text-gray-400"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={status === "error"}
          className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Sending link…" : "Email me a sign-in link"}
      </button>

      <p className="text-center text-xs text-gray-600">
        New here?{" "}
        <Link
          href="/apply"
          className="rounded-sm text-gray-400 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Start Learning
        </Link>
      </p>
    </form>
  );
}
