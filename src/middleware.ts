import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_CONFIGURED =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  if (ADMIN_EMAILS.length === 0) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Create a redirect that preserves Set-Cookie headers from Supabase token refresh */
function redirectWithCookies(url: URL, source: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  if (!SUPABASE_CONFIGURED) {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Protect /admin routes — admin emails only
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!user || !isAdmin(user.email)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return redirectWithCookies(url, supabaseResponse);
      }
    }

    // Protect /dashboard — authenticated approved users only
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return redirectWithCookies(url, supabaseResponse);
      }
      const memberStatus = user.app_metadata?.member_status;
      if (memberStatus && memberStatus !== "approved") {
        const url = request.nextUrl.clone();
        url.pathname = "/pending-approval";
        return redirectWithCookies(url, supabaseResponse);
      }
    }

    // Member approval check — non-admin users with pending/rejected status
    if (user && !isAdmin(user.email)) {
      const memberStatus = user.app_metadata?.member_status;
      const isOnPendingPage = request.nextUrl.pathname === "/pending-approval";
      const isPublicPath = request.nextUrl.pathname === "/" ||
        request.nextUrl.pathname.startsWith("/stock/") ||
        request.nextUrl.pathname.startsWith("/stocks") ||
        request.nextUrl.pathname.startsWith("/trend") ||
        request.nextUrl.pathname.startsWith("/api/") ||
        request.nextUrl.pathname.startsWith("/auth/");

      if (memberStatus && memberStatus !== "approved" && !isOnPendingPage && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/pending-approval";
        return redirectWithCookies(url, supabaseResponse);
      }
    }

    // Redirect logged-in users away from /login and /register
    if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && user) {
      const url = request.nextUrl.clone();
      url.pathname = isAdmin(user.email) ? "/admin" : "/";
      return redirectWithCookies(url, supabaseResponse);
    }
  } catch {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return redirectWithCookies(url, supabaseResponse);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
