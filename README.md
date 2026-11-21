# TicketFlow

A small Jira-style ticketing system built with Next.js 15 (App Router, server actions) and SQLite.

## Features

- **Kanban board**: drag tickets between To Do / In Progress / In Review / Done, with search and assignee filters
- **Tickets**: story / task / bug, priority, assignee, story points, description, comment thread
- **Projects**: each has a key, so tickets get IDs like `WEB-12`
- **Sprints**: plan in the backlog, start a sprint (the board then shows only that sprint), and complete it (unfinished tickets go back to the backlog)
- **Users & auth**: email/password sign-up with bcrypt and httpOnly session cookies. The first account becomes the admin; admins can change roles and delete projects

## Getting started

```bash
npm install
npm run seed      # optional demo data: ada@ticketflow.dev / password123
npm run dev       # http://localhost:3000
```

Run `node scripts/seed.mjs --reset` to wipe the database and reseed it.
Stop the dev server first, because Windows locks the open database file.

The database lives in `data/ticketflow.db`, which git ignores. The schema is in `src/lib/schema.sql`
and is applied automatically on startup.

## Layout

| Path | What |
| --- | --- |
| `src/lib/` | DB connection, schema, auth/session helpers, read queries, shared types |
| `src/app/actions.ts` | All mutations (server actions) |
| `src/app/(auth)/` | Login and register |
| `src/app/(app)/` | Projects list, people page, project board, backlog, and ticket detail pages |
| `scripts/seed.mjs` | Demo data |
