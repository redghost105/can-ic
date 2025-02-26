import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get pathname
  const pathname = req.nextUrl.pathname;

  // Auth routes - redirect to dashboard if already authenticated
  const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];
  if (authRoutes.includes(pathname) && session) {
    const url = new URL("/dashboard", req.url);
    return NextResponse.redirect(url);
  }

  // Protected routes - redirect to login if not authenticated
  if (pathname.startsWith("/dashboard") && !session) {
    const url = new URL("/auth/login", req.url);
    return NextResponse.redirect(url);
  }

  // Home page - redirect to dashboard if authenticated
  if (pathname === "/" && session) {
    const url = new URL("/dashboard", req.url);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 