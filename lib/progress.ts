import { createClient } from "@/lib/supabase/server";
import { curriculum, totalLessons, type Module } from "@/lib/curriculum";

/**
 * Learner progress.
 *
 * When Supabase is configured, progress is read from the `lesson_progress`
 * table (real, per-learner data). When it is not configured, we return an
 * HONEST empty progress object — never fabricated completions.
 */

export interface LessonProgressRecord {
  moduleSlug: string;
  lessonSlug: string;
  completedAt: string;
}

export interface LevelProgress {
  module: Module;
  completedLessons: number;
  totalLessons: number;
  state: "locked" | "in-progress" | "completed";
}

export interface LearnerProgress {
  completed: Set<string>; // `${moduleSlug}/${lessonSlug}`
  totalCompleted: number;
  totalLessons: number;
  percent: number;
  levels: LevelProgress[];
  /** First not-completed lesson the learner should continue with. */
  nextLesson: { moduleSlug: string; lessonSlug: string } | null;
}

function keyFor(moduleSlug: string, lessonSlug: string): string {
  return `${moduleSlug}/${lessonSlug}`;
}

/** Reads real completion records for a user, or [] when unavailable. */
async function fetchCompletedLessons(
  userId: string,
): Promise<LessonProgressRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("module_slug, lesson_slug, completed_at")
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  if (error || !data) return [];

  return data.map((row) => ({
    moduleSlug: row.module_slug as string,
    lessonSlug: row.lesson_slug as string,
    completedAt: row.completed_at as string,
  }));
}

/** Builds the full progress view model for a learner. */
export async function getLearnerProgress(
  userId: string | null,
): Promise<LearnerProgress> {
  const records = userId ? await fetchCompletedLessons(userId) : [];
  const completed = new Set(
    records.map((r) => keyFor(r.moduleSlug, r.lessonSlug)),
  );

  const total = totalLessons();
  const totalCompleted = completed.size;

  let previousLevelComplete = true;
  let nextLesson: LearnerProgress["nextLesson"] = null;

  const levels: LevelProgress[] = curriculum.map((module) => {
    const completedLessons = module.lessons.filter((l) =>
      completed.has(keyFor(module.slug, l.slug)),
    ).length;
    const allDone =
      module.lessons.length > 0 && completedLessons === module.lessons.length;

    // A level is available once the previous level is complete.
    const unlocked = previousLevelComplete;
    const state: LevelProgress["state"] = allDone
      ? "completed"
      : unlocked
        ? "in-progress"
        : "locked";

    if (unlocked && !nextLesson) {
      const firstIncomplete = module.lessons.find(
        (l) => !completed.has(keyFor(module.slug, l.slug)),
      );
      if (firstIncomplete) {
        nextLesson = { moduleSlug: module.slug, lessonSlug: firstIncomplete.slug };
      }
    }

    previousLevelComplete = previousLevelComplete && allDone;

    return {
      module,
      completedLessons,
      totalLessons: module.lessons.length,
      state,
    };
  });

  return {
    completed,
    totalCompleted,
    totalLessons: total,
    percent: total === 0 ? 0 : Math.round((totalCompleted / total) * 100),
    levels,
    nextLesson,
  };
}
