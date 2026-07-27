import { NextResponse } from "next/server";

/**
 * Reserved: start an automated assignment (create learner repository).
 * Not implemented in Sprint 1. Returns 501 so no repositories are provisioned
 * and no fake "started" state is returned.
 */
export function POST() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "Technical assignments are not open yet.",
    },
    { status: 501 },
  );
}
