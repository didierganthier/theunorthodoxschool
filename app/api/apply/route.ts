import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "applications.json");

const IS_SERVERLESS = process.env.VERCEL === "1";

const REQUIRED_FIELDS = [
  "fullName",
  "age",
  "phone",
  "email",
  "situation",
  "aiExperience",
  "motivation",
  "goal3months",
  "commitHours",
  "readyToAct",
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  // Validate required fields
  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { message: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  // Validate email
  if (!isValidEmail(String(body.email))) {
    return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
  }

  // Sanitize: only keep known fields as strings
  const application = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    fullName: String(body.fullName).trim().slice(0, 200),
    age: String(body.age).trim().slice(0, 10),
    phone: String(body.phone).trim().slice(0, 50),
    email: String(body.email).trim().toLowerCase().slice(0, 200),
    situation: String(body.situation).trim().slice(0, 100),
    aiExperience: String(body.aiExperience).trim().slice(0, 100),
    motivation: String(body.motivation).trim().slice(0, 2000),
    goal3months: String(body.goal3months).trim().slice(0, 2000),
    commitHours: String(body.commitHours).trim().slice(0, 10),
    readyToAct: String(body.readyToAct).trim().slice(0, 10),
  };

  try {
    // ── Strategy 1: Webhook (Zapier / Make / n8n) ─────────────────────────
    // Set WEBHOOK_URL in Vercel environment variables to receive every
    // application as a POST payload in any automation tool.
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(application),
      });
    }

    // ── Strategy 2: Local file (development only) ────────────────────────
    if (!IS_SERVERLESS) {
      await mkdir(DATA_DIR, { recursive: true });
      let applications: unknown[] = [];
      try {
        const raw = await readFile(FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) applications = parsed;
      } catch {
        // File doesn't exist yet — start fresh
      }
      applications.push(application);
      await writeFile(FILE_PATH, JSON.stringify(applications, null, 2), "utf-8");
    }

    // ── Always: log to console (visible in Vercel Functions logs) ────────
    console.log("NEW_APPLICATION", JSON.stringify(application));

    return NextResponse.json({ message: "Application received." }, { status: 201 });
  } catch (err) {
    console.error("Failed to save application:", err);
    return NextResponse.json(
      { message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
