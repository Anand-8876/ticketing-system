"use client";

import { useActionState, useState } from "react";
import { updateTicket, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/Buttons";
import { PRIORITIES, STATUSES, TYPES, capitalize, type Sprint, type Ticket, type User } from "@/lib/types";

export function TicketForm({
  ticket: t,
  users,
  sprints,
}: {
  ticket: Ticket;
  users: User[];
  sprints: Sprint[];
}) {
  const [state, action] = useActionState<FormState, FormData>(updateTicket, undefined);
  const [dirty, setDirty] = useState(false);

  return (
    <form
      // Remount after each save so inputs pick up the fresh server values.
      key={t.updated_at}
      action={action}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      className="grid gap-6 md:grid-cols-[1fr_260px]"
    >
      <input type="hidden" name="ticketId" value={t.id} />
      <div className="space-y-4">
        <input
          name="title"
          defaultValue={t.title}
          required
          aria-label="Summary"
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold text-white outline-none hover:border-line focus:border-neon focus:bg-panel/80"
        />
        <div>
          <label className="label" htmlFor="desc">Description</label>
          <textarea
            id="desc"
            name="description"
            defaultValue={t.description}
            rows={10}
            className="input"
            placeholder="Add a description…"
          />
        </div>
        <div className="flex items-center gap-3">
          <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
          {dirty && !state?.ok && <span className="text-xs text-amber-300">Unsaved changes</span>}
          {state?.ok && !dirty && <span className="text-xs text-neon-hi">Saved ✓</span>}
          {state?.error && <span className="text-sm text-rose-400">{state.error}</span>}
        </div>
      </div>

      <aside className="card h-fit space-y-3 p-4">
        <Field label="Status">
          <select name="status" defaultValue={t.status} className="input">
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Assignee">
          <select name="assigneeId" defaultValue={t.assignee_id ?? ""} className="input">
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select name="type" defaultValue={t.type} className="input">
            {TYPES.map((x) => (
              <option key={x} value={x}>{capitalize(x)}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue={t.priority} className="input">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{capitalize(p)}</option>
            ))}
          </select>
        </Field>
        <Field label="Sprint">
          <select name="sprintId" defaultValue={t.sprint_id ?? ""} className="input">
            <option value="">Backlog</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.status === "active" ? " (active)" : s.status === "completed" ? " (completed)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Story points">
          <input name="storyPoints" type="number" min={0} max={100} defaultValue={t.story_points ?? ""} className="input" />
        </Field>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
