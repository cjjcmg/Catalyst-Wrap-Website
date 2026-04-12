import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "catalyst-motorsport-secret-change-me"
);

const COOKIE_NAME = "admin_session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Pass user info to API routes and pages via headers
    const response = NextResponse.next();
    response.headers.set("x-user-id", String(payload.id));
    response.headers.set("x-user-email", String(payload.email));
    response.headers.set("x-user-name", String(payload.name));
    response.headers.set("x-user-role", String(payload.role));
    return response;
  } catch {
    // Invalid/expired token — clear cookie and redirect
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }
}

export const config = {
  matcher: ["/admin/((?!login|reset-password).*)"],
};
