import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/server/supabase";

// Supabase Auth OAuth redirect target. Exchanges the code for a session,
// then redirects to `next` (or /profile by default). signInBootstrap fires
// on the first authenticated read via getCurrentUser — not here, so this
// handler stays a thin adapter.
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  // /events is the admin landing page for staff. /profile is an attendee
  // route that doesn't exist here; keeping it as the default would 404 any
  // OAuth callback that arrives without an explicit `next` param.
  const next = url.searchParams.get("next") ?? "/events";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", url));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, url),
    );
  }

  return NextResponse.redirect(new URL(next, url));
}
