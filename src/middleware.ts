import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// All routes are protected by default (TECH-STACK → Authentication Standards).
// This is an edge-safe OPTIMISTIC check: it only confirms a session cookie is
// present (no DB call). Authoritative validation happens server-side in the
// protected layout via auth.api.getSession.
const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = getSessionCookie(request) !== null;

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!hasSession && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except the auth API (must stay public) and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
