"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { moveTicket } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { PriorityIcon, TypeIcon } from "@/components/Icons";
import { STATUSES, type Status, type Ticket, type User } from "@/lib/types";

type DropTarget = { status: Status; index: number };

export function Board({
  projectKey,
  tickets: serverTickets,
  users,
}: {
  projectKey: string;
  tickets: Ticket[];
  users: User[];
}) {
  const [tickets, setTickets] = useState(serverTickets);
  useEffect(() => setTickets(serverTickets), [serverTickets]);

  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [dragId, setDragId] = useState<number | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const [, startTransition] = useTransition();

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = tickets.filter((t) => {
      if (assignee === "unassigned" ? t.assignee_id != null : assignee !== "all" && String(t.assignee_id) !== assignee)
        return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || `${projectKey}-${t.number}`.toLowerCase().includes(q);
    });
    return STATUSES.map((s) => ({
      ...s,
      items: visible.filter((t) => t.status === s.id).sort((a, b) => a.position - b.position),
    }));
  }, [tickets, query, assignee, projectKey]);

  function drop(status: Status, visibleIndex: number) {
    const id = dragId;
    setDragId(null);
    setTarget(null);
    if (id == null) return;
    const moving = tickets.find((t) => t.id === id);
    if (!moving) return;

    // Translate the drop slot (among visible cards) into a slot in the full, unfiltered column.
    const visibleCol = columns.find((c) => c.id === status)!.items.filter((t) => t.id !== id);
    const beforeId = visibleCol[visibleIndex]?.id;
    const fullCol = tickets
      .filter((t) => t.status === status && t.id !== id)
      .sort((a, b) => a.position - b.position);
    const at = beforeId == null ? fullCol.length : fullCol.findIndex((t) => t.id === beforeId);
    fullCol.splice(at, 0, { ...moving, status });
    const ordered = fullCol.map((t, i) => ({ ...t, position: i }));

    setTickets((prev) => [...prev.filter((t) => t.status !== status && t.id !== id), ...ordered]);
    startTransition(() => moveTicket(id, status, ordered.map((t) => t.id)));
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="input w-56"
          placeholder="Search this board"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex -space-x-1">
          {users.map((u) => {
            const on = assignee === String(u.id);
            return (
              <button
                key={u.id}
                onClick={() => setAssignee(on ? "all" : String(u.id))}
                className={`rounded-full ring-2 transition ${on ? "z-10 ring-neon" : "ring-ink hover:z-10"}`}
              >
                <Avatar id={u.id} name={u.name} />
              </button>
            );
          })}
        </div>
        <button
          className={`btn-ghost ${assignee === "unassigned" ? "bg-neon/15" : ""}`}
          onClick={() => setAssignee(assignee === "unassigned" ? "all" : "unassigned")}
        >
          Unassigned
        </button>
        {(query || assignee !== "all") && (
          <button className="btn-ghost text-neon" onClick={() => { setQuery(""); setAssignee("all"); }}>
            Clear filters
          </button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[repeat(4,minmax(240px,1fr))] gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          // Drop slots are counted without the card being dragged.
          const others = col.items.filter((t) => t.id !== dragId);
          const slotOf = new Map(others.map((t, i) => [t.id, i]));
          return (
          <section
            key={col.id}
            className={`flex min-h-0 flex-col border border-line bg-panel-2/50 transition ${
              target?.status === col.id ? "bg-neon/10 ring-1 ring-neon/60" : ""
            }`}
            onDragOver={(e) => {
              if (dragId == null) return;
              e.preventDefault();
              // Hovering the empty part of a column means "append to the end".
              if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.colBody) {
                setTarget({ status: col.id, index: others.length });
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setTarget(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (target) drop(target.status, target.index);
            }}
          >
            <header className="flex items-center justify-between border-b border-line px-3 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-neon-hi">
              {col.label}
              <span className="border border-neon/40 px-2 py-0.5 text-ice">{col.items.length}</span>
            </header>
            <div data-col-body="1" className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {col.items.map((t) => {
                const slot = slotOf.get(t.id);
                return (
                  <div key={t.id}>
                    {slot != null && target?.status === col.id && target.index === slot && <DropLine />}
                    <Card
                      ticket={t}
                      projectKey={projectKey}
                      dragging={dragId === t.id}
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setTarget(null);
                      }}
                      onDragOver={(e) => {
                        if (dragId == null) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (slot == null) return; // hovering the dragged card itself
                        const rect = e.currentTarget.getBoundingClientRect();
                        const after = e.clientY > rect.top + rect.height / 2;
                        setTarget({ status: col.id, index: slot + (after ? 1 : 0) });
                      }}
                    />
                  </div>
                );
              })}
              {target?.status === col.id && target.index >= others.length && <DropLine />}
              {col.items.length === 0 && target?.status !== col.id && (
                <div data-col-body="1" className="py-6 text-center text-xs text-mute/70">
                  Drop tickets here
                </div>
              )}
            </div>
          </section>
          );
        })}
      </div>
    </>
  );
}

function DropLine() {
  return <div className="my-1 h-0.5 bg-neon shadow-[0_0_8px_#3da9ff]" />;
}

function Card({
  ticket: t,
  projectKey,
  dragging,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  ticket: Ticket;
  projectKey: string;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  const href = `/p/${projectKey}/t/${t.number}`;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(t.id));
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={`card cursor-grab p-3 transition hover:border-line hover:shadow-[0_0_14px_rgb(61_169_255/0.3)] active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <Link href={href} draggable={false} className="block text-sm leading-snug text-ice hover:text-neon-hi hover:underline">
        {t.title}
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <TypeIcon type={t.type} />
        <Link href={href} draggable={false} className="font-mono text-xs tracking-wider text-neon hover:underline">
          {projectKey}-{t.number}
        </Link>
        <PriorityIcon priority={t.priority} />
        <div className="ml-auto flex items-center gap-2">
          {t.story_points != null && (
            <span className="border border-neon/40 bg-neon/10 px-1.5 font-mono text-xs text-neon-hi">
              {t.story_points}
            </span>
          )}
          <Avatar id={t.assignee_id} name={t.assignee_name} size="sm" />
        </div>
      </div>
    </div>
  );
}
