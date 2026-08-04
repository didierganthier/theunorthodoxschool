import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateApplication } from "@/lib/apply-validation";

/**
 * Receives an /apply submission and persists it to Supabase.
 *
 * Supabase is the SINGLE SOURCE OF TRUTH. We never return success unless the
 * database insert actually succeeded. Flow:
 *
 *   validate → insert via submit_application() → (optional) webhook → success
 *
 * A webhook failure never discards an already-stored application. Applicant
 * free-text answers are never logged.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const result = validateApplication(body);
  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, errors: result.errors },
      { status: 400 },
    );
  }

  // Persistence is required. If Supabase is not configured, do NOT pretend the
  // application was received.
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        message:
          "Applications are temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      {
        message:
          "Applications are temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }

  // Attach the authenticated user id when present (applicants may be anon).
  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const payload = { ...result.data, user_id: userId ?? "" };

  const { data, error } = await supabase.rpc("submit_application", {
    p: payload,
  });

  if (error) {
    // Do not leak details or applicant answers.
    console.error("Application persistence failed.");
    return NextResponse.json(
      { message: "We couldn't save your application. Please try again." },
      { status: 500 },
    );
  }

  const outcome = (data ?? {}) as {
    duplicate?: boolean;
    id?: string;
    submitted_at?: string;
  };

  if (outcome.duplicate) {
    return NextResponse.json(
      {
        message:
          "We already have a recent application for this email. If this is a mistake, contact support and we'll help.",
        duplicate: true,
      },
      { status: 409 },
    );
  }

  if (!outcome.id) {
    // Unexpected: no id means nothing was stored — never report success.
    return NextResponse.json(
      { message: "We couldn't save your application. Please try again." },
      { status: 500 },
    );
  }

  // Secondary, best-effort notification. A failure here must NOT fail the
  // request — the application is already stored.
  const webhookUrl = process.env.WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: outcome.id,
          full_name: result.data.full_name,
          email: result.data.email,
          submitted_at: outcome.submitted_at,
        }),
      });
    } catch {
      // Swallow: notification is optional; the application is safely stored.
    }
  }

  return NextResponse.json(
    { message: "Application received.", email: result.data.email },
    { status: 201 },
  );
}
