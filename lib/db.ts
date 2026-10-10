import initSqlJs, { type Database } from "sql.js";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./security.mjs";
const directory = path.resolve(process.env.DATA_DIR || "./data");
const file = path.join(directory, "orbit.sqlite");
let pending: Promise<Database> | undefined;
export async function database() {
  if (!pending)
    pending = (async () => {
      const SQL = await initSqlJs({
        locateFile: () =>
          path.join(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm"),
      });
      fs.mkdirSync(directory, { recursive: true });
      const db = new SQL.Database(
        fs.existsSync(file) ? fs.readFileSync(file) : undefined,
      );
      db.run(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('Admin','User'))); CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, name TEXT NOT NULL, client TEXT NOT NULL, budget REAL NOT NULL, status TEXT NOT NULL, owner INTEGER NOT NULL, created TEXT NOT NULL)",
      );
      if (!rows(db, "SELECT id FROM users").length) {
        db.run("INSERT INTO users VALUES (1,?,?,?,?),(2,?,?,?,?)", [
          "Alex Morgan",
          "admin@orbit.demo",
          hashPassword("OrbitDemo123!"),
          "Admin",
          "Jamie Chen",
          "user@orbit.demo",
          hashPassword("OrbitDemo123!"),
          "User",
        ]);
        const seeds = [
          ["Website redesign", "Acme Studio", 12500, "In progress", 1],
          ["Brand identity", "Linear Labs", 8400, "Completed", 2],
          ["Mobile application", "Vertex", 24000, "In progress", 2],
          ["Marketing campaign", "Notion Works", 6200, "Planning", 1],
          ["Customer portal", "Arc Technologies", 18000, "Completed", 1],
          ["Analytics platform", "Focal", 15600, "Planning", 2],
        ];
        for (const s of seeds)
          db.run(
            "INSERT INTO projects(name,client,budget,status,owner,created) VALUES (?,?,?,?,?,?)",
            [...s, "2026-10-01"] as (string | number)[],
          );
        persist(db);
      }
      return db;
    })();
  return pending;
}
export function rows(
  db: Database,
  sql: string,
  params: (string | number)[] = [],
) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const result: Record<string, any>[] = [];
    while (stmt.step()) result.push(stmt.getAsObject());
    return result;
  } finally {
    stmt.free();
  }
}
export function persist(db: Database) {
  const temporary = file + ".tmp";
  fs.writeFileSync(temporary, db.export());
  fs.renameSync(temporary, file);
}
