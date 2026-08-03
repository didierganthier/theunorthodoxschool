import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { callbackHasCredentials } from "@/lib/auth-utils";
import { initializeLearner } from "@/lib/supabase/init";

/**
 * Magic-link callback.
 *
 * 1. Reads the authorization `code` (PKCE) or `token_hash`/`type` from the URL.
 * 2. Exchanges it for a Supabase session, persisted via secure cookies by the
 *    @supabase/ssr server client.
 * 3. Initializes the learner's profile + enrollment (idempotent).
 * 4. Redirects to a safe internal `next` path (default /dashboard).
 * 5. On any failure, redirects to /login with a safe, non-sensitive error code.
 *
 * Never logs authorization codes, access tokens, or refresh tokens.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (!callbackHasCredentials({ code, tokenHash, type })) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=unconfigured`);
  }

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash as string,
      });

  if (result.error || !result.data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    await initializeLearner(supabase, result.data.user.id);
  } catch {
    // Non-fatal: the learner is authenticated; initialization is idempotent
    // and will succeed on a later request.
  }

  return NextResponse.redirect(`${origin}${next}`);
}
