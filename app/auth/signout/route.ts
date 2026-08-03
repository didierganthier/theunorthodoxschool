import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Signs the current learner out and returns to the home page.
 * The @supabase/ssr server client clears the session cookies. The no-store
 * header prevents a stale, authenticated page from being served from cache
 * after sign-out.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  const response = NextResponse.redirect(`${request.nextUrl.origin}/`, {
    status: 303,
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
