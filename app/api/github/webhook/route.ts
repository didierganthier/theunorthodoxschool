import { NextResponse } from "next/server";

/**
 * Reserved: GitHub webhook receiver.
 * Not implemented in Sprint 1. Returns 501 so no fake events are processed.
 */
export function POST() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "GitHub webhooks are not enabled yet.",
    },
    { status: 501 },
  );
}
