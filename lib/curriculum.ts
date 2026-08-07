/**
 * Curriculum data — the single source of truth for levels and lessons.
 *
 * Used by public preview pages (/curriculum) and by the authenticated learning
 * experience (/learn). Public pages must render PREVIEW states only and never
 * imply the visitor is enrolled or has made progress.
 */

export type LessonType =
  | "reading"
  | "quiz"
  | "written-exercise"
  | "interactive"
  | "github-assignment"
  | "deployment-check"
  | "reflection";

/** Progress state for a lesson or level in the learner experience. */
export type ProgressState = "locked" | "available" | "completed";

export interface CheckpointField {
  name: string;
  label: string;
  placeholder: string;
  /** Minimum meaningful length enforced on both client and server. */
  minLength: number;
  multiline?: boolean;
}

export interface Checkpoint {
  /** Stable identifier used to record attempts. */
  slug: string;
  title: string;
  description: string;
  /** Implemented kinds: "learning-goal", "quiz", "github-assignment". */
  kind: "learning-goal" | "quiz" | "placeholder" | "github-assignment";
  fields?: CheckpointField[];
  /** For kind "github-assignment": the assignment slug this checkpoint maps to. */
  assignmentSlug?: string;
}

export interface Lesson {
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  lessonType: LessonType;
  /** Rich content blocks rendered top-to-bottom. */
  content?: LessonBlock[];
  keyIdeas?: string[];
  example?: string;
  practice?: string;
  checkpoint?: Checkpoint;
}

export type LessonBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

export interface Module {
  slug: string;
  level: number;
  title: string;
  objective: string;
  topics: string[];
  exampleExercise: string;
  expectedArtifact: string;
  lessons: Lesson[];
}

// ── Level 0: fully authored content ──────────────────────────────────────────

const level0: Module = {
  slug: "level-0-orientation",
  level: 0,
  title: "Orientation and Setup",
  objective:
    "Understand how autonomous learning works, set a personal learning goal, and prepare the tools you need to build.",
  topics: [
    "How autonomous learning works",
    "Setting a learning goal",
    "Creating a GitHub account",
    "Understanding assignments",
    "Completing the first repository exercise",
  ],
  exampleExercise:
    "Write a clear, specific learning goal describing the skill you want to develop and the project you want to build.",
  expectedArtifact: "A saved learning goal and a prepared GitHub account.",
  lessons: [
    {
      slug: "welcome",
      title: "Welcome to The Unorthodox School",
      objective:
        "Understand what this school is, who it is for, and how you will learn here.",
      estimatedMinutes: 8,
      lessonType: "reading",
      content: [
        {
          type: "paragraph",
          text: "This is not a traditional classroom. There is no lecture hall, no fixed schedule, and no waiting for a teacher to move the class forward. You progress by demonstrating that you have learned something — not by attending.",
        },
        {
          type: "heading",
          text: "What makes this different",
        },
        {
          type: "paragraph",
          text: "Every lesson ends with a checkpoint. A checkpoint is a small, automatically evaluated task: a quiz, a written exercise, an interactive activity, or a project on GitHub. You unlock the next lesson only when the checkpoint passes.",
        },
        {
          type: "paragraph",
          text: "This means your progress is real. It reflects what you can actually do, not how many hours you sat through.",
        },
      ],
      keyIdeas: [
        "You learn by doing, then proving it with a checkpoint.",
        "Lessons unlock progressively as you pass checkpoints.",
        "The program is self-paced — move as fast or as carefully as you need.",
      ],
      example:
        "Instead of 'watch a 2-hour lecture', a lesson here might be: read a short explanation, then build a tiny thing and submit it. The building is the point.",
      practice:
        "Take a moment and write down, on paper or in a note, one honest reason you want to learn something new right now.",
    },
    {
      slug: "how-autonomous-learning-works",
      title: "How autonomous learning works",
      objective:
        "Understand the learn → practice → submit → feedback → pass loop that drives every lesson.",
      estimatedMinutes: 10,
      lessonType: "reading",
      content: [
        {
          type: "paragraph",
          text: "Every lesson follows the same rhythm. Once you understand the rhythm, the whole program becomes predictable and calm.",
        },
        {
          type: "heading",
          text: "The learning loop",
        },
        {
          type: "list",
          items: [
            "Learn — read a short, focused lesson.",
            "Practice — try the idea yourself.",
            "Submit — complete the checkpoint.",
            "Feedback — get an immediate result.",
            "Correct — fix mistakes if needed.",
            "Pass — the next lesson unlocks.",
          ],
        },
        {
          type: "paragraph",
          text: "There is no 'Mark as complete' button. A lesson is complete only when its checkpoint passes. This keeps your progress honest.",
        },
      ],
      keyIdeas: [
        "The loop is: learn, practice, submit, feedback, correct, pass.",
        "Checkpoints — not self-declaration — mark a lesson complete.",
        "Getting something wrong is part of the loop, not a failure.",
      ],
      example:
        "If a quiz checkpoint says you missed a concept, you review that part and try again. Retrying is normal and expected.",
      practice:
        "Describe the learning loop in your own words in a single sentence.",
      checkpoint: {
        slug: "level-0-autonomous-learning",
        title: "Checkpoint: How autonomous learning works",
        description:
          "Answer a few questions to confirm the core ideas are clear. You need 80% to pass and can retry as many times as you need.",
        kind: "quiz",
      },
    },
    {
      slug: "set-your-learning-goal",
      title: "Set your learning goal",
      objective:
        "Define a specific, personal learning goal that will guide your work through the program.",
      estimatedMinutes: 15,
      lessonType: "written-exercise",
      content: [
        {
          type: "paragraph",
          text: "A vague goal like 'learn tech' leads nowhere. A specific goal like 'learn enough web development to build and publish a simple site for my family business' gives every lesson a purpose.",
        },
        {
          type: "heading",
          text: "What makes a good goal",
        },
        {
          type: "list",
          items: [
            "It names a concrete skill.",
            "It connects to something you actually care about.",
            "It points toward a project you could build.",
            "It is honest about the time you can commit.",
            "It anticipates getting stuck — and plans for it.",
          ],
        },
      ],
      keyIdeas: [
        "Specific goals make abstract lessons feel relevant.",
        "A goal tied to a real project keeps you motivated.",
        "Planning for being stuck is part of a serious goal.",
      ],
      example:
        "Skill: web development. Why: to stop depending on others for a simple website. Project: a one-page site for my cousin's barbershop. Time: 4 hours per week. When stuck: search, re-read the lesson, then ask in the community.",
      practice:
        "Complete the checkpoint below. Your answers are saved as your learning goal and you can revisit them anytime.",
      checkpoint: {
        slug: "learning-goal",
        title: "Learning Goal Exercise",
        description:
          "Define your learning goal. All fields are required and must be specific enough to be useful to you later.",
        kind: "learning-goal",
        fields: [
          {
            name: "skill",
            label: "The skill I want to develop",
            placeholder: "e.g. Web development — building and publishing simple websites",
            minLength: 12,
          },
          {
            name: "why",
            label: "Why I want to learn it",
            placeholder: "e.g. So I can build things myself instead of depending on others",
            minLength: 20,
            multiline: true,
          },
          {
            name: "project",
            label: "A project I may want to build",
            placeholder: "e.g. A one-page website for a small local business",
            minLength: 15,
            multiline: true,
          },
          {
            name: "timeCommitment",
            label: "My weekly time commitment",
            placeholder: "e.g. About 4 hours per week, mostly on weekends",
            minLength: 8,
          },
          {
            name: "whenStuck",
            label: "What I will do when I get stuck",
            placeholder: "e.g. Re-read the lesson, search online, then ask for help",
            minLength: 20,
            multiline: true,
          },
        ],
      },
    },
    {
      slug: "create-your-github-account",
      title: "Create and prepare your GitHub account",
      objective:
        "Create a GitHub account and understand why it is central to proving your work.",
      estimatedMinutes: 12,
      lessonType: "reading",
      content: [
        {
          type: "paragraph",
          text: "GitHub is where your technical work lives. Later in the program, your projects will be stored, checked, and published there automatically. Setting up your account now removes friction later.",
        },
        {
          type: "heading",
          text: "Steps",
        },
        {
          type: "list",
          items: [
            "Go to github.com and sign up with an email you check.",
            "Choose a professional username — you may share it publicly.",
            "Verify your email address.",
            "Add a profile photo and a short bio (optional but recommended).",
          ],
        },
        {
          type: "paragraph",
          text: "You do not need to know how to code to create the account. You are just preparing the workspace.",
        },
      ],
      keyIdeas: [
        "GitHub stores and verifies your technical projects.",
        "A clear, professional username is worth choosing carefully.",
        "Account setup now saves time when assignments open.",
      ],
      example:
        "A good username looks like 'marie-joseph-dev' rather than something you would not want an employer to see.",
      practice:
        "Create your GitHub account and note your username somewhere safe. You will connect it later when technical assignments open.",
    },
    {
      slug: "understand-assignments",
      title: "Understand assignments and automated checks",
      objective:
        "Understand how automated checks evaluate technical assignments and what a passing result means.",
      estimatedMinutes: 10,
      lessonType: "reading",
      content: [
        {
          type: "paragraph",
          text: "When technical assignments open, you will complete work in a GitHub repository. Automated checks then run against your work and report a clear result: passed, failed, or still running.",
        },
        {
          type: "heading",
          text: "What the checks look at",
        },
        {
          type: "list",
          items: [
            "Whether required files exist and were not removed.",
            "Whether your project meets the assignment's requirements.",
            "Whether the project builds or deploys correctly, when relevant.",
          ],
        },
        {
          type: "paragraph",
          text: "If a check evaluates your work incorrectly, that is not the end of the road — administrative support can review appeals.",
        },
      ],
      keyIdeas: [
        "Automated checks give fast, consistent feedback.",
        "A passing check means your work met the stated requirements.",
        "Incorrect evaluations can be appealed to a human.",
      ],
      example:
        "An assignment might require an index.html file with a heading. The check confirms the file exists and contains a heading, then passes.",
      practice:
        "In one sentence, describe what a 'passing' automated check tells you about your work.",
    },
    {
      slug: "first-repository-exercise",
      title: "Complete Assignment 00 on GitHub",
      objective:
        "Connect GitHub, generate your private repository, edit one file, and let automated checks grade and complete your first assignment.",
      estimatedMinutes: 20,
      lessonType: "github-assignment",
      content: [
        {
          type: "paragraph",
          text: "This is your first real GitHub assignment. You will connect your GitHub account, the school will generate a private repository just for you, and you will make one small edit. Automated checks then grade your work and complete this lesson.",
        },
        {
          type: "heading",
          text: "What will happen",
        },
        {
          type: "list",
          items: [
            "You connect your GitHub account to your learner profile.",
            "The school generates a private repository from the assignment template and invites you to it.",
            "You accept the invitation, then edit student/profile.json with your details.",
            "GitHub Actions runs automated checks on your change.",
            "When the checks pass and the protected files are intact, this lesson completes automatically.",
          ],
        },
        {
          type: "paragraph",
          text: "You only edit student/profile.json. The grading files are protected — changing them will cause the check to fail, so leave them as they are.",
        },
      ],
      keyIdeas: [
        "Your repository is private and created for you inside the school's GitHub organization.",
        "You edit only student/profile.json; the automated checks do the rest.",
        "The lesson completes when the assignment passes — no manual button.",
      ],
      example:
        "Open student/profile.json, fill in your name, GitHub username, favorite language, and why you joined, then commit. The checks run within a minute.",
      practice:
        "Connect GitHub below, start the assignment, accept the repository invitation, and submit your profile.",
      checkpoint: {
        slug: "assignment-00",
        title: "Checkpoint: Complete Assignment 00",
        description:
          "Connect GitHub, generate your private repository, edit student/profile.json, and let the automated checks grade your work. This lesson completes when the assignment passes.",
        kind: "github-assignment",
        assignmentSlug: "assignment-00",
      },
    },
  ],
};

// ── Levels 1–5: preview definitions (lessons authored in later sprints) ──────

function previewLessons(titles: string[]): Lesson[] {
  return titles.map((title) => ({
    slug: title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    title,
    objective: "Detailed lesson content opens as you progress through the program.",
    estimatedMinutes: 12,
    lessonType: "reading" as LessonType,
  }));
}

const level1: Module = {
  slug: "level-1-the-shift",
  level: 1,
  title: "The Shift",
  objective:
    "Understand the modern digital world and build the habits that make independent learning possible.",
  topics: [
    "The modern digital world",
    "Learning how to learn",
    "Research and information literacy",
    "Digital safety",
    "Identifying real problems",
  ],
  exampleExercise:
    "Research a real problem in your community and document three credible sources about it.",
  expectedArtifact: "A short written analysis of a real problem worth solving.",
  lessons: previewLessons([
    "The modern digital world",
    "Learning how to learn",
    "Research and information literacy",
    "Digital safety",
    "Identifying real problems",
  ]),
};

const level2: Module = {
  slug: "level-2-ai-as-a-tool",
  level: 2,
  title: "AI as a Tool",
  objective:
    "Learn to use AI effectively and responsibly to accelerate learning, research, and building.",
  topics: [
    "What AI can and cannot do",
    "Effective prompting",
    "AI for learning",
    "AI for research",
    "AI for productivity",
    "Responsible AI use",
  ],
  exampleExercise:
    "Use an AI tool to plan a small project, then critically evaluate what it got right and wrong.",
  expectedArtifact: "A documented AI-assisted workflow with your own critique.",
  lessons: previewLessons([
    "What AI can and cannot do",
    "Effective prompting",
    "AI for learning",
    "AI for research",
    "AI for productivity",
    "Responsible AI use",
  ]),
};

const level3: Module = {
  slug: "level-3-build-something",
  level: 3,
  title: "Build Something",
  objective:
    "Learn how the web works and publish your first real project using Git and GitHub.",
  topics: [
    "How websites work",
    "Git and GitHub",
    "HTML",
    "CSS",
    "JavaScript",
    "Publishing a project",
  ],
  exampleExercise:
    "Build a simple web page in a GitHub repository and publish it so anyone can visit it.",
  expectedArtifact: "A published web page backed by a GitHub repository.",
  lessons: previewLessons([
    "How websites work",
    "Git and GitHub",
    "HTML",
    "CSS",
    "JavaScript",
    "Publishing a project",
  ]),
};

const level4: Module = {
  slug: "level-4-opportunities",
  level: 4,
  title: "Opportunities",
  objective:
    "Turn skills into proof: define an MVP, build an online presence, and present your work professionally.",
  topics: [
    "Skills versus proof",
    "Defining an MVP",
    "Building an online presence",
    "Documenting a project",
    "Presenting professional work",
  ],
  exampleExercise:
    "Write a clear README and project summary that could convince someone to trust your work.",
  expectedArtifact: "A documented project and a basic professional online presence.",
  lessons: previewLessons([
    "Skills versus proof",
    "Defining an MVP",
    "Building an online presence",
    "Documenting a project",
    "Presenting professional work",
  ]),
};

const level5: Module = {
  slug: "level-5-showcase",
  level: 5,
  title: "Showcase",
  objective:
    "Plan, build, deploy, and publish a capstone project — the verified proof that you completed the program.",
  topics: [
    "Plan a capstone",
    "Build the first version",
    "Improve quality",
    "Deploy it",
    "Document and publish it",
    "Complete a final reflection",
  ],
  exampleExercise:
    "Ship a deployed capstone project with documentation and a written reflection.",
  expectedArtifact: "A deployed, documented capstone project you built yourself.",
  lessons: previewLessons([
    "Plan a capstone",
    "Build the first version",
    "Improve quality",
    "Deploy it",
    "Document and publish it",
    "Complete a final reflection",
  ]),
};

export const curriculum: Module[] = [
  level0,
  level1,
  level2,
  level3,
  level4,
  level5,
];

export function getModule(slug: string): Module | undefined {
  return curriculum.find((m) => m.slug === slug);
}

export function getLesson(
  moduleSlug: string,
  lessonSlug: string,
): { module: Module; lesson: Lesson; index: number } | undefined {
  const mod = getModule(moduleSlug);
  if (!mod) return undefined;
  const index = mod.lessons.findIndex((l) => l.slug === lessonSlug);
  if (index === -1) return undefined;
  return { module: mod, lesson: mod.lessons[index], index };
}

/** Total number of lessons across all modules. */
export function totalLessons(): number {
  return curriculum.reduce((sum, m) => sum + m.lessons.length, 0);
}
