import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { SignJWT } from "jose";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "catalyst-motorsport-secret-change-me"
);

// POST: Request a password reset (sends email)
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists (but always return success to prevent email enumeration)
    const { data: user } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (user) {
      // Create a short-lived reset token (1 hour)
      const resetToken = await new SignJWT({ userId: user.id, email: user.email, type: "reset" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .setIssuedAt()
        .sign(JWT_SECRET);

      const domain = process.env.NEXT_PUBLIC_SITE_URL || "https://catalystmotorsport.com";
      const resetUrl = `${domain}/admin/reset-password?token=${resetToken}`;

      await sendEmail({
        to: user.email,
        subject: "Password Reset — Catalyst Motorsport",
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:10px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Reset Password</a></p>
          <p style="color:#888;font-size:12px;">If you didn't request this, you can ignore this email.</p>
        `,
      });
    }

    // Always return success
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT: Actually reset the password (with token + new password)
export async function PUT(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== "reset" || !payload.userId) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", payload.userId);

    if (error) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }
}
