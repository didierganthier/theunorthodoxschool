import { NextResponse, type NextRequest } from "next/server";
import { getLesson } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";

/**
 * Validates and records a lesson checkpoint.
 *
 * The SERVER is the source of truth: a lesson is only marked complete after the
 * answers pass validation here. When Supabase is configured, the attempt and
 * completion are persisted with Row Level Security. When it is not, we validate
 * honestly and return `persisted: false` so the client can store interim work
 * locally without pretending it was saved server-side.
 */
export async function POST(request: NextRequest) {
  let body: {
    moduleSlug?: string;
    lessonSlug?: string;
    checkpointSlug?: string;
    answers?: Record<string, string>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { passed: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const { moduleSlug, lessonSlug, answers } = body;
  if (!moduleSlug || !lessonSlug || !answers) {
    return NextResponse.json(
      { passed: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  const found = getLesson(moduleSlug, lessonSlug);
  const checkpoint = found?.lesson.checkpoint;
  if (!found || !checkpoint || checkpoint.kind !== "learning-goal") {
    return NextResponse.json(
      { passed: false, message: "This checkpoint is not available." },
      { status: 404 },
    );
  }

  // Server-side validation of every field.
  const fieldErrors: Record<string, string> = {};
  for (const field of checkpoint.fields ?? []) {
    const value = (answers[field.name] ?? "").toString().trim();
    if (value.length < field.minLength) {
      fieldErrors[field.name] =
        `Please write at least ${field.minLength} characters.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        passed: false,
        fieldErrors,
        message: "Some answers need a little more detail.",
      },
      { status: 422 },
    );
  }

  // Passed validation. Persist if we can.
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ passed: true, persisted: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { passed: false, message: "Please sign in to save your progress." },
      { status: 401 },
    );
  }

  const now = new Date().toISOString();

  // Record the attempt (passed).
  await supabase.from("exercise_attempts").insert({
    user_id: user.id,
    module_slug: moduleSlug,
    lesson_slug: lessonSlug,
    checkpoint_slug: checkpoint.slug,
    payload: answers,
    passed: true,
    created_at: now,
  });

  // Mark the lesson complete (idempotent upsert).
  const { error: progressError } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        module_slug: moduleSlug,
        lesson_slug: lessonSlug,
        completed_at: now,
      },
      { onConflict: "user_id,module_slug,lesson_slug" },
    );

  if (progressError) {
    return NextResponse.json(
      {
        passed: true,
        persisted: false,
        message: "Validated, but saving progress failed. Please try again.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ passed: true, persisted: true });
}
