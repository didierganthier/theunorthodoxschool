import { NextResponse } from "next/server";

/**
 * Reserved: GitHub OAuth/App callback.
 * Not implemented in Sprint 1. Returns 501 so no fake success is possible.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "GitHub connection is not available yet.",
    },
    { status: 501 },
  );
}
