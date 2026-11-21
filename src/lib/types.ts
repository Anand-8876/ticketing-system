// Shared between server and client components — keep free of Node imports.

export const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "In Review" },
  { id: "done", label: "Done" },
] as const;
export type Status = (typeof STATUSES)[number]["id"];

export const TYPES = ["story", "task", "bug"] as const;
export type TicketType = (typeof TYPES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Role = "admin" | "member";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description: string;
  lead_id: number | null;
  lead_name: string | null;
  created_at: string;
  ticket_count: number;
  open_count: number;
}

export interface Sprint {
  id: number;
  project_id: number;
  name: string;
  goal: string;
  status: "planned" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Ticket {
  id: number;
  project_id: number;
  number: number;
  title: string;
  description: string;
  type: TicketType;
  priority: Priority;
  status: Status;
  assignee_id: number | null;
  assignee_name: string | null;
  reporter_id: number | null;
  reporter_name: string | null;
  sprint_id: number | null;
  sprint_name: string | null;
  story_points: number | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  ticket_id: number;
  author_id: number | null;
  author_name: string | null;
  body: string;
  created_at: string;
}

export function statusLabel(status: Status) {
  return STATUSES.find((s) => s.id === status)?.label ?? status;
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** SQLite datetime('now') values are UTC without a zone marker. */
export function parseDbDate(value: string) {
  return new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
}

export function timeAgo(value: string) {
  const seconds = Math.round((Date.now() - parseDbDate(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units: [number, string][] = [
    [60, "minute"],
    [60, "hour"],
    [24, "day"],
    [30, "month"],
    [12, "year"],
  ];
  let n = seconds;
  let unit = "second";
  for (const [size, name] of units) {
    if (n < size) break;
    n = Math.floor(n / size);
    unit = name;
  }
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}
