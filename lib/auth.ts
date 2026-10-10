import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { database, rows } from "./db";
import { readSession } from "./security.mjs";
const localSecret = randomBytes(32).toString("hex");
export function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production")
    throw new Error("SESSION_SECRET is required in production");
  return localSecret;
}
export async function currentUser() {
  const token = (await cookies()).get("orbit_session")?.value;
  if (!token) return null;
  const id = readSession(token, secret());
  if (!id) return null;
  return (
    rows(await database(), "SELECT id,name,email,role FROM users WHERE id=?", [
      id,
    ])[0] || null
  );
}
