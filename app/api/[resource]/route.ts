import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { database, persist, rows } from "@/lib/db";
import { hashPassword } from "@/lib/security.mjs";
type Context = { params: Promise<{ resource: string }> };
export const runtime = "nodejs";
export async function GET(_: Request, context: Context) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { resource } = await context.params;
  const db = await database();
  if (resource === "projects")
    return NextResponse.json(
      rows(
        db,
        "SELECT projects.*, users.name AS ownerName FROM projects JOIN users ON users.id=projects.owner" +
          (user.role === "Admin" ? "" : " WHERE owner=?") +
          " ORDER BY projects.id DESC",
        user.role === "Admin" ? [] : [user.id],
      ),
    );
  if (resource === "users" && user.role === "Admin")
    return NextResponse.json(rows(db, "SELECT id,name,email,role FROM users"));
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
async function mutate(request: Request, context: Context) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { resource } = await context.params;
  if (!["projects", "users"].includes(resource))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (resource === "users" && user.role !== "Admin")
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  let b;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const db = await database();
  if (request.method !== "POST") {
    if (!Number.isInteger(b.id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const existing = rows(db, `SELECT * FROM ${resource} WHERE id=?`, [
      b.id,
    ])[0];
    if (!existing)
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    if (
      resource === "projects" &&
      user.role !== "Admin" &&
      existing.owner !== user.id
    )
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    if (resource === "users" && b.id === user.id)
      return NextResponse.json(
        { error: "You cannot modify your own admin account" },
        { status: 400 },
      );
  }
  try {
    if (request.method === "DELETE") {
      if (
        resource === "users" &&
        rows(db, "SELECT id FROM projects WHERE owner=?", [b.id]).length
      )
        return NextResponse.json(
          {
            error:
              "Reassign this user’s projects before deleting their account",
          },
          { status: 409 },
        );
      db.run(`DELETE FROM ${resource} WHERE id=?`, [b.id]);
    } else if (resource === "projects") {
      if (
        typeof b.name !== "string" ||
        !b.name.trim() ||
        b.name.length > 100 ||
        typeof b.client !== "string" ||
        !b.client.trim() ||
        b.client.length > 100 ||
        !Number.isFinite(b.budget) ||
        b.budget < 0 ||
        b.budget > 100000000 ||
        !["Planning", "In progress", "Completed"].includes(b.status)
      )
        return NextResponse.json(
          { error: "Please enter a name, client, valid budget and status" },
          { status: 400 },
        );
      const owner = user.role === "Admin" ? Number(b.owner) : user.id;
      if (
        !Number.isInteger(owner) ||
        !rows(db, "SELECT id FROM users WHERE id=?", [owner]).length
      )
        return NextResponse.json(
          { error: "Select a valid owner" },
          { status: 400 },
        );
      if (request.method === "POST")
        db.run(
          "INSERT INTO projects(name,client,budget,status,owner,created) VALUES(?,?,?,?,?,?)",
          [
            b.name.trim(),
            b.client.trim(),
            b.budget,
            b.status,
            owner,
            new Date().toISOString().slice(0, 10),
          ],
        );
      else
        db.run(
          "UPDATE projects SET name=?,client=?,budget=?,status=?,owner=? WHERE id=?",
          [b.name.trim(), b.client.trim(), b.budget, b.status, owner, b.id],
        );
    } else {
      if (
        typeof b.name !== "string" ||
        !b.name.trim() ||
        b.name.length > 100 ||
        typeof b.email !== "string" ||
        b.email.length > 254 ||
        !/^\S+@\S+\.\S+$/.test(b.email) ||
        !["Admin", "User"].includes(b.role)
      )
        return NextResponse.json(
          { error: "Enter a valid name, email and role" },
          { status: 400 },
        );
      if (request.method === "POST") {
        if (
          typeof b.password !== "string" ||
          b.password.length < 12 ||
          b.password.length > 128
        )
          return NextResponse.json(
            { error: "Password must be 12–128 characters" },
            { status: 400 },
          );
        db.run("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)", [
          b.name.trim(),
          b.email.toLowerCase().trim(),
          hashPassword(b.password),
          b.role,
        ]);
      } else
        db.run("UPDATE users SET name=?,email=?,role=? WHERE id=?", [
          b.name.trim(),
          b.email.toLowerCase().trim(),
          b.role,
          b.id,
        ]);
    }
    persist(db);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to save. Email may already exist." },
      { status: 409 },
    );
  }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
