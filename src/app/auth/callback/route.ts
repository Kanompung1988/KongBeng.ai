// Auth callback — exchanges code for session after email confirmation
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successfully confirmed — redirect to the intended page
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If no code or error, redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
