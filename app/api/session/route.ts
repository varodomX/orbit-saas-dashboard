import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { database, rows } from "@/lib/db";
import { currentUser, secret } from "@/lib/auth";
import { signSession, verifyPassword } from "@/lib/security.mjs";
import { isAllowedOrigin } from "@/lib/origin.mjs";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}
export async function POST(request: Request) {
  if (!isAllowedOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const prior = attempts.get(email);
  if (prior && prior.until > Date.now() && prior.count >= 10)
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  const user = rows(await database(), "SELECT * FROM users WHERE email=?", [
    email,
  ])[0];
  if (
    typeof body.password !== "string" ||
    !user ||
    !verifyPassword(body.password, user.password)
  ) {
    attempts.set(email, {
      count: prior && prior.until > Date.now() ? prior.count + 1 : 1,
      until: Date.now() + 900000,
    });
    return NextResponse.json(
      { error: "Email or password is incorrect" },
      { status: 401 },
    );
  }
  attempts.delete(email);
  (await cookies()).set("orbit_session", signSession(user.id, secret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 86400,
  });
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
export async function DELETE(request: Request) {
  if (!isAllowedOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  (await cookies()).delete("orbit_session");
  return NextResponse.json({ ok: true });
}
