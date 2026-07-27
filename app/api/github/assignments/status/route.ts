import { NextResponse } from "next/server";

/**
 * Reserved: poll an automated assignment's grading status.
 * Not implemented in Sprint 1. Returns 501 so no fake pass/fail is reported.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "Assignment grading is not available yet.",
    },
    { status: 501 },
  );
}
