"use client";

import { useState } from "react";
import Link from "next/link";

type FormData = {
  fullName: string;
  age: string;
  phone: string;
  email: string;
  situation: string;
  aiExperience: string;
  motivation: string;
  goal3months: string;
  commitHours: string;
  readyToAct: string;
};

const initial: FormData = {
  fullName: "",
  age: "",
  phone: "",
  email: "",
  situation: "",
  aiExperience: "",
  motivation: "",
  goal3months: "",
  commitHours: "",
  readyToAct: "",
};

export default function ApplyForm() {
  const [form, setForm] = useState<FormData>(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Something went wrong.");
      }

      setStatus("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMsg(message);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-lg">
          <p className="text-4xl mb-6">✓</p>
          <h1 className="text-3xl font-bold text-white mb-4">
            Application received.
          </h1>
          <p className="text-gray-400 leading-relaxed mb-8">
            Thank you for applying to The Unorthodox School. We review
            applications manually and will reach out via WhatsApp or email
            within a few days.
          </p>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-[#0a0a0a] text-[#ededed] min-h-screen font-sans">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back
        </Link>
        <span className="text-sm font-semibold tracking-wider uppercase text-white">
          The Unorthodox School
        </span>
        <div className="w-12" />
      </nav>

      <div className="max-w-xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
          Self-paced · Start when you&apos;re ready
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Apply to The Unorthodox School
        </h1>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed">
          We review every application personally. Fill this out honestly —
          that&apos;s all we ask.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1 */}
          <fieldset className="space-y-4">
            <legend className="text-xs uppercase tracking-[0.25em] text-gray-600 mb-4 block">
              Basic Information
            </legend>

            <Field label="Full Name" required>
              <input
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" required>
                <input
                  name="age"
                  type="number"
                  required
                  min={13}
                  max={70}
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 22"
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp Number" required>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+509..."
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Email" required>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={inputClass}
              />
            </Field>
          </fieldset>

          <hr className="border-white/10" />

          {/* SECTION 2 */}
          <fieldset className="space-y-4">
            <legend className="text-xs uppercase tracking-[0.25em] text-gray-600 mb-4 block">
              Your Profile
            </legend>

            <Field label="What is your current situation?" required>
              <select
                name="situation"
                required
                value={form.situation}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select one</option>
                <option>Student</option>
                <option>Working</option>
                <option>Unemployed</option>
                <option>Freelancing</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Have you ever used AI tools like ChatGPT?" required>
              <select
                name="aiExperience"
                required
                value={form.aiExperience}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select one</option>
                <option>Yes, regularly</option>
                <option>Yes, a little</option>
                <option>No</option>
              </select>
            </Field>
          </fieldset>

          <hr className="border-white/10" />

          {/* SECTION 3 */}
          <fieldset className="space-y-4">
            <legend className="text-xs uppercase tracking-[0.25em] text-gray-600 mb-4 block">
              Motivation
            </legend>

            <Field label="Why do you want to join The Unorthodox School?" required>
              <textarea
                name="motivation"
                required
                rows={4}
                value={form.motivation}
                onChange={handleChange}
                placeholder="Be honest. What brought you here?"
                className={inputClass}
              />
            </Field>

            <Field label="What do you hope to achieve in the next 3 months?" required>
              <textarea
                name="goal3months"
                required
                rows={3}
                value={form.goal3months}
                onChange={handleChange}
                placeholder="Be specific."
                className={inputClass}
              />
            </Field>
          </fieldset>

          <hr className="border-white/10" />

          {/* SECTION 4 */}
          <fieldset className="space-y-4">
            <legend className="text-xs uppercase tracking-[0.25em] text-gray-600 mb-4 block">
              Commitment
            </legend>

            <Field
              label="Can you commit a few focused hours each week to keep momentum?"
              required
            >
              <div className="flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <label
                    key={opt}
                    className={`flex-1 flex items-center justify-center py-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                      form.commitHours === opt
                        ? "border-white text-white bg-white/5"
                        : "border-white/10 text-gray-500 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="commitHours"
                      value={opt}
                      required
                      checked={form.commitHours === opt}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>

            <Field
              label="This program requires action, not just watching. Are you ready to build?"
              required
            >
              <div className="flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <label
                    key={opt}
                    className={`flex-1 flex items-center justify-center py-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                      form.readyToAct === opt
                        ? "border-white text-white bg-white/5"
                        : "border-white/10 text-gray-500 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="readyToAct"
                      value={opt}
                      required
                      checked={form.readyToAct === opt}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
          </fieldset>

          {status === "error" && (
            <p className="text-red-400 text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-4 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Submitting..." : "Submit Application"}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Not everyone is accepted. We&apos;ll reach out personally.
          </p>
        </form>
      </div>
    </main>
  );
}

const inputClass =
  "w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">
        {label}
        {required && <span className="text-gray-600 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
