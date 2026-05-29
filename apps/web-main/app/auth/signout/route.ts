import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/server/supabase";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url));
}
