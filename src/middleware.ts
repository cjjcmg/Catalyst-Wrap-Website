import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin_session");
  const password = process.env.ADMIN_PASSWORD || "";
  const expectedToken = createHash("sha256").update(password).digest("hex");

  if (!session || session.value !== expectedToken) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
