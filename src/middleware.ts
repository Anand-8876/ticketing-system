import { NextResponse, type NextRequest } from "next/server";

// Cheap gate: bounce visitors without a session cookie to /login.
// Pages and actions still validate the session against the database.
const PUBLIC = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const isPublic = PUBLIC.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isPublic && !req.cookies.has("tf_session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
