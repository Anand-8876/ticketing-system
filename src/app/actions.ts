"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRIORITIES, STATUSES, TYPES, type Role, type Status } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;

// ---------- helpers ----------

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optInt(fd: FormData, key: string) {
  const v = str(fd, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const STATUS_IDS = STATUSES.map((s) => s.id);

function projectKey(projectId: number) {
  const row = db.prepare(`SELECT key FROM projects WHERE id = ?`).get(projectId) as
    | { key: string }
    | undefined;
  if (!row) throw new Error("Project not found.");
  return row.key;
}

function ticketRow(ticketId: number) {
  const row = db
    .prepare(`SELECT id, project_id, number, status, sprint_id FROM tickets WHERE id = ?`)
    .get(ticketId) as
    | { id: number; project_id: number; number: number; status: Status; sprint_id: number | null }
    | undefined;
  if (!row) throw new Error("Ticket not found.");
  return row;
}

function sprintRow(sprintId: number) {
  const row = db.prepare(`SELECT id, project_id, status FROM sprints WHERE id = ?`).get(sprintId) as
    | { id: number; project_id: number; status: "planned" | "active" | "completed" }
    | undefined;
  if (!row) throw new Error("Sprint not found.");
  return row;
}

/** Returns sprintId if it belongs to the project and is still open, else null. */
function validSprint(projectId: number, sprintId: number | null) {
  if (sprintId == null) return null;
  const row = db
    .prepare(`SELECT id FROM sprints WHERE id = ? AND project_id = ? AND status != 'completed'`)
    .get(sprintId, projectId);
  return row ? sprintId : null;
}

function validUser(userId: number | null) {
  if (userId == null) return null;
  return db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId) ? userId : null;
}

function nextPosition(projectId: number, status: Status) {
  const row = db
    .prepare(
      `SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM tickets WHERE project_id = ? AND status = ?`,
    )
    .get(projectId, status) as { pos: number };
  return row.pos;
}

function refresh(key: string) {
  revalidatePath(`/p/${key}`, "layout");
  revalidatePath("/");
}

// ---------- auth ----------

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !email) return { error: "Name and email are required." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (db.prepare(`SELECT 1 FROM users WHERE email = ?`).get(email)) {
    return { error: "An account with that email already exists." };
  }

  const { c } = db.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number };
  const role: Role = c === 0 ? "admin" : "member"; // first user runs the place
  const hash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`)
    .run(name, email, hash, role);

  await createSession(Number(lastInsertRowid));
  redirect("/");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = db.prepare(`SELECT id, password_hash FROM users WHERE email = ?`).get(email) as
    | { id: number; password_hash: string }
    | undefined;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { error: "Wrong email or password." };
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- projects ----------

export async function createProject(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(fd, "name");
  const key = str(fd, "key").toUpperCase();
  const description = str(fd, "description");
  if (!name) return { error: "Project name is required." };
  if (!/^[A-Z][A-Z0-9]{1,5}$/.test(key)) {
    return { error: "Key must be 2–6 letters/digits and start with a letter." };
  }
  if (db.prepare(`SELECT 1 FROM projects WHERE key = ?`).get(key)) {
    return { error: `Key ${key} is already taken.` };
  }
  db.prepare(`INSERT INTO projects (key, name, description, lead_id) VALUES (?, ?, ?, ?)`).run(
    key,
    name,
    description,
    user.id,
  );
  revalidatePath("/");
  redirect(`/p/${key}`);
}

export async function deleteProject(projectId: number) {
  await requireAdmin();
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(projectId);
  revalidatePath("/");
  redirect("/");
}

// ---------- tickets ----------

export async function createTicket(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const projectId = optInt(fd, "projectId");
  if (projectId == null) return { error: "Missing project." };
  const key = projectKey(projectId);

  const title = str(fd, "title");
  if (!title) return { error: "Give the ticket a summary." };
  const type = oneOf(str(fd, "type"), TYPES, "task");
  const priority = oneOf(str(fd, "priority"), PRIORITIES, "medium");
  const assigneeId = validUser(optInt(fd, "assigneeId"));
  const sprintId = validSprint(projectId, optInt(fd, "sprintId"));
  const points = optInt(fd, "storyPoints");
  const description = str(fd, "description");

  const number = db.transaction(() => {
    const { next_number } = db
      .prepare(`SELECT next_number FROM projects WHERE id = ?`)
      .get(projectId) as { next_number: number };
    db.prepare(`UPDATE projects SET next_number = next_number + 1 WHERE id = ?`).run(projectId);
    db.prepare(
      `INSERT INTO tickets (project_id, number, title, description, type, priority, status,
         assignee_id, reporter_id, sprint_id, story_points, position)
       VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?, ?, ?)`,
    ).run(
      projectId,
      next_number,
      title,
      description,
      type,
      priority,
      assigneeId,
      user.id,
      sprintId,
      points,
      nextPosition(projectId, "todo"),
    );
    return next_number;
  })();

  refresh(key);
  return { ok: true, message: `Created ${key}-${number}` };
}

export async function updateTicket(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const ticketId = optInt(fd, "ticketId");
  if (ticketId == null) return { error: "Missing ticket." };
  const current = ticketRow(ticketId);

  const title = str(fd, "title");
  if (!title) return { error: "Summary can't be empty." };
  const status = oneOf(str(fd, "status"), STATUS_IDS, current.status);
  const position =
    status === current.status ? null : nextPosition(current.project_id, status as Status);
  // Leaving a ticket in its (possibly completed) sprint is always allowed.
  const requestedSprint = optInt(fd, "sprintId");
  const sprintId =
    requestedSprint === current.sprint_id
      ? current.sprint_id
      : validSprint(current.project_id, requestedSprint);

  db.prepare(
    `UPDATE tickets SET title = ?, description = ?, type = ?, priority = ?, status = ?,
       assignee_id = ?, sprint_id = ?, story_points = ?,
       position = COALESCE(?, position), updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    title,
    str(fd, "description"),
    oneOf(str(fd, "type"), TYPES, "task"),
    oneOf(str(fd, "priority"), PRIORITIES, "medium"),
    status,
    validUser(optInt(fd, "assigneeId")),
    sprintId,
    optInt(fd, "storyPoints"),
    position,
    ticketId,
  );

  refresh(projectKey(current.project_id));
  return { ok: true, message: "Saved" };
}

/** Drag-and-drop on the board: put ticket in `status` and renumber that column. */
export async function moveTicket(ticketId: number, status: Status, orderedIds: number[]) {
  await requireUser();
  if (!STATUS_IDS.includes(status)) throw new Error("Bad status.");
  const current = ticketRow(ticketId);

  db.transaction(() => {
    db.prepare(
      `UPDATE tickets SET status = ?,
         updated_at = CASE WHEN status != ? THEN datetime('now') ELSE updated_at END
       WHERE id = ?`,
    ).run(status, status, ticketId);
    const setPos = db.prepare(
      `UPDATE tickets SET position = ? WHERE id = ? AND project_id = ? AND status = ?`,
    );
    orderedIds.forEach((id, i) => setPos.run(i, id, current.project_id, status));
  })();

  refresh(projectKey(current.project_id));
}

export async function setTicketSprint(ticketId: number, sprintId: number | null) {
  await requireUser();
  const current = ticketRow(ticketId);
  db.prepare(`UPDATE tickets SET sprint_id = ?, updated_at = datetime('now') WHERE id = ?`).run(
    validSprint(current.project_id, sprintId),
    ticketId,
  );
  refresh(projectKey(current.project_id));
}

export async function deleteTicket(ticketId: number) {
  await requireUser();
  const current = ticketRow(ticketId);
  const key = projectKey(current.project_id);
  db.prepare(`DELETE FROM tickets WHERE id = ?`).run(ticketId);
  refresh(key);
  redirect(`/p/${key}`);
}

// ---------- comments ----------

export async function addComment(ticketId: number, fd: FormData) {
  const user = await requireUser();
  const body = str(fd, "body");
  if (!body) return;
  const current = ticketRow(ticketId);
  db.prepare(`INSERT INTO comments (ticket_id, author_id, body) VALUES (?, ?, ?)`).run(
    ticketId,
    user.id,
    body,
  );
  refresh(projectKey(current.project_id));
}

export async function deleteComment(commentId: number) {
  const user = await requireUser();
  const comment = db
    .prepare(
      `SELECT c.author_id, t.project_id FROM comments c JOIN tickets t ON t.id = c.ticket_id
       WHERE c.id = ?`,
    )
    .get(commentId) as { author_id: number | null; project_id: number } | undefined;
  if (!comment) return;
  if (comment.author_id !== user.id && user.role !== "admin") {
    throw new Error("You can only delete your own comments.");
  }
  db.prepare(`DELETE FROM comments WHERE id = ?`).run(commentId);
  refresh(projectKey(comment.project_id));
}

// ---------- sprints ----------

export async function createSprint(projectId: number, fd: FormData) {
  await requireUser();
  const key = projectKey(projectId);
  const { c } = db.prepare(`SELECT COUNT(*) AS c FROM sprints WHERE project_id = ?`).get(projectId) as {
    c: number;
  };
  const name = str(fd, "name") || `${key} Sprint ${c + 1}`;
  db.prepare(`INSERT INTO sprints (project_id, name, goal) VALUES (?, ?, ?)`).run(
    projectId,
    name,
    str(fd, "goal"),
  );
  refresh(key);
}

export async function startSprint(sprintId: number) {
  await requireUser();
  const sprint = sprintRow(sprintId);
  if (sprint.status !== "planned") return;
  const active = db
    .prepare(`SELECT 1 FROM sprints WHERE project_id = ? AND status = 'active'`)
    .get(sprint.project_id);
  if (active) throw new Error("Complete the active sprint before starting another.");
  db.prepare(
    `UPDATE sprints SET status = 'active', start_date = date('now'), end_date = date('now', '+14 days')
     WHERE id = ?`,
  ).run(sprintId);
  refresh(projectKey(sprint.project_id));
}

/** Done tickets stay with the sprint; everything else goes back to the backlog. */
export async function completeSprint(sprintId: number) {
  await requireUser();
  const sprint = sprintRow(sprintId);
  if (sprint.status !== "active") return;
  db.transaction(() => {
    db.prepare(`UPDATE tickets SET sprint_id = NULL WHERE sprint_id = ? AND status != 'done'`).run(
      sprintId,
    );
    db.prepare(`UPDATE sprints SET status = 'completed', end_date = date('now') WHERE id = ?`).run(
      sprintId,
    );
  })();
  refresh(projectKey(sprint.project_id));
}

export async function deleteSprint(sprintId: number) {
  await requireUser();
  const sprint = sprintRow(sprintId);
  if (sprint.status !== "planned") throw new Error("Only planned sprints can be deleted.");
  db.prepare(`DELETE FROM sprints WHERE id = ?`).run(sprintId); // tickets fall back to backlog
  refresh(projectKey(sprint.project_id));
}

// ---------- users ----------

export async function setUserRole(userId: number, role: Role) {
  await requireAdmin();
  if (role !== "admin" && role !== "member") throw new Error("Bad role.");
  if (role === "member") {
    const { c } = db
      .prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND id != ?`)
      .get(userId) as { c: number };
    if (c === 0) throw new Error("There must be at least one admin.");
  }
  db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, userId);
  revalidatePath("/users");
}
