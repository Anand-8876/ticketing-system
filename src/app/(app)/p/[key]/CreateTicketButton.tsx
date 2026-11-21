"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTicket, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/Buttons";
import { PRIORITIES, TYPES, capitalize, type Sprint, type User } from "@/lib/types";

export function CreateTicketButton({
  projectId,
  users,
  sprints,
  defaultSprintId,
}: {
  projectId: number;
  users: User[];
  sprints: Sprint[];
  defaultSprintId: number | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState<FormState, FormData>(createTicket, undefined);

  useEffect(() => {
    if (state?.ok) dialog.current?.close();
  }, [state]);

  return (
    <>
      <button className="btn-primary" onClick={() => dialog.current?.showModal()}>
        + Create ticket
      </button>
      {state?.ok && state.message && (
        <span className="text-sm text-neon-hi" role="status">{state.message}</span>
      )}
      <dialog ref={dialog} className="m-auto w-full max-w-xl rounded-xl p-0 shadow-2xl">
        <form action={action} className="space-y-4 p-6">
          <h2 className="heading neon-text text-lg font-bold">Create ticket</h2>
          <input type="hidden" name="projectId" value={projectId} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ct-type">Type</label>
              <select id="ct-type" name="type" className="input" defaultValue="task">
                {TYPES.map((t) => (
                  <option key={t} value={t}>{capitalize(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ct-priority">Priority</label>
              <select id="ct-priority" name="priority" className="input" defaultValue="medium">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{capitalize(p)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="ct-title">Summary</label>
            <input id="ct-title" name="title" className="input" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="ct-desc">Description</label>
            <textarea id="ct-desc" name="description" rows={4} className="input" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="ct-assignee">Assignee</label>
              <select id="ct-assignee" name="assigneeId" className="input" defaultValue="">
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ct-sprint">Sprint</label>
              <select
                id="ct-sprint"
                name="sprintId"
                className="input"
                defaultValue={defaultSprintId ?? ""}
              >
                <option value="">Backlog</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.status === "active" ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ct-points">Story points</label>
              <input id="ct-points" name="storyPoints" type="number" min={0} max={100} className="input" />
            </div>
          </div>

          {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <SubmitButton pendingText="Creating…">Create</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
