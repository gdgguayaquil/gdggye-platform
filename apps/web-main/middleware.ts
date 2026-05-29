import { NextResponse, type NextRequest } from "next/server";

import { LANG_COOKIE, isLang } from "@gdggye/i18n";

// Reads ?lang=es|en from the URL, persists it in the gdg-lang cookie, and
// redirects to the same URL with the param stripped. Lets users share a
// translated link (e.g. /events/bwai-2026?lang=en) and have the site stick
// to that language for subsequent navigation.
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const langParam = url.searchParams.get("lang");

  if (langParam && isLang(langParam)) {
    const redirectUrl = url.clone();
    redirectUrl.searchParams.delete("lang");
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(LANG_COOKIE, langParam, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals + static assets so the redirect doesn't fire on /_next/*.
  matcher: [
    "/((?!_next|api|auth|favicon.ico|manifest.webmanifest|sw.js|icon).*)",
  ],
};
