import { db } from "./db";
import type { Comment, Project, Sprint, Ticket, User } from "./types";

const TICKET_SELECT = `
  SELECT t.*, a.name AS assignee_name, r.name AS reporter_name, s.name AS sprint_name
  FROM tickets t
  LEFT JOIN users a ON a.id = t.assignee_id
  LEFT JOIN users r ON r.id = t.reporter_id
  LEFT JOIN sprints s ON s.id = t.sprint_id`;

const PROJECT_SELECT = `
  SELECT p.*, u.name AS lead_name,
    (SELECT COUNT(*) FROM tickets t WHERE t.project_id = p.id) AS ticket_count,
    (SELECT COUNT(*) FROM tickets t WHERE t.project_id = p.id AND t.status != 'done') AS open_count
  FROM projects p LEFT JOIN users u ON u.id = p.lead_id`;

export function listProjects() {
  return db.prepare(`${PROJECT_SELECT} ORDER BY p.name`).all() as Project[];
}

export function getProjectByKey(key: string) {
  return db.prepare(`${PROJECT_SELECT} WHERE p.key = ?`).get(key.toUpperCase()) as
    | Project
    | undefined;
}

export function listUsers() {
  return db
    .prepare(`SELECT id, name, email, role, created_at FROM users ORDER BY name`)
    .all() as User[];
}

export function listSprints(projectId: number) {
  return db
    .prepare(
      `SELECT * FROM sprints WHERE project_id = ?
       ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END, id`,
    )
    .all(projectId) as Sprint[];
}

export function listTickets(projectId: number) {
  return db
    .prepare(`${TICKET_SELECT} WHERE t.project_id = ? ORDER BY t.position, t.id`)
    .all(projectId) as Ticket[];
}

export function getTicket(projectId: number, number: number) {
  return db
    .prepare(`${TICKET_SELECT} WHERE t.project_id = ? AND t.number = ?`)
    .get(projectId, number) as Ticket | undefined;
}

export function listComments(ticketId: number) {
  return db
    .prepare(
      `SELECT c.*, u.name AS author_name FROM comments c
       LEFT JOIN users u ON u.id = c.author_id
       WHERE c.ticket_id = ? ORDER BY c.created_at, c.id`,
    )
    .all(ticketId) as Comment[];
}
