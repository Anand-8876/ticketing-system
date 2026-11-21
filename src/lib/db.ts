import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "ticketflow.db");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "schema.sql");

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  return db;
}

// Reuse one connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __ticketflowDb?: Database.Database };
export const db = globalForDb.__ticketflowDb ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.__ticketflowDb = db;
