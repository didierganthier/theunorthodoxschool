import { NextResponse, type NextRequest } from "next/server";
import { getLesson } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";

/**
 * Marks a *reading* lesson complete.
 *
 * Reading lessons have no automatically graded checkpoint, so the learner
 * confirms they have read the lesson to unlock the next one. Lessons that DO
 * have an interactive checkpoint must be completed through that checkpoint
 * (`/api/learn/checkpoint`) — they cannot be self-marked here.
 *
 * The server is the source of truth: it verifies the lesson exists, has no
 * interactive checkpoint, and records the completion under Row Level Security.
 */
export async function POST(request: NextRequest) {
  let body: { moduleSlug?: string; lessonSlug?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { completed: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const { moduleSlug, lessonSlug } = body;
  if (!moduleSlug || !lessonSlug) {
    return NextResponse.json(
      { completed: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  const found = getLesson(moduleSlug, lessonSlug);
  if (!found) {
    return NextResponse.json(
      { completed: false, message: "This lesson is not available." },
      { status: 404 },
    );
  }

  // Lessons with an interactive checkpoint cannot be self-marked as read.
  if (found.lesson.checkpoint) {
    return NextResponse.json(
      {
        completed: false,
        message: "Complete this lesson's checkpoint to continue.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    // Supabase not configured: validated honestly, nothing to persist.
    return NextResponse.json({ completed: true, persisted: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { completed: false, message: "Please sign in to save your progress." },
      { status: 401 },
    );
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      module_slug: moduleSlug,
      lesson_slug: lessonSlug,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,module_slug,lesson_slug" },
  );

  if (error) {
    return NextResponse.json(
      {
        completed: false,
        message: "Saving your progress failed. Please try again.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ completed: true, persisted: true });
}
