"use client";

import { useTransition } from "react";
import { setTicketSprint } from "@/app/actions";
import type { Sprint } from "@/lib/types";

export function SprintSelect({
  ticketId,
  sprintId,
  sprints,
}: {
  ticketId: number;
  sprintId: number | null;
  sprints: Sprint[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="Move to sprint"
      className="input w-36 py-1 text-xs"
      value={sprintId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value ? Number(e.target.value) : null;
        startTransition(() => setTicketSprint(ticketId, next));
      }}
    >
      <option value="">Backlog</option>
      {sprints.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
}
