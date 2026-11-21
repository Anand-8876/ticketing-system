import Link from "next/link";
import { notFound } from "next/navigation";
import { completeSprint, createSprint, deleteSprint, startSprint } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { ConfirmButton, SubmitButton } from "@/components/Buttons";
import { PriorityIcon, StatusPill, TypeIcon } from "@/components/Icons";
import { getProjectByKey, listSprints, listTickets } from "@/lib/queries";
import type { Sprint, Ticket } from "@/lib/types";
import { SprintSelect } from "./SprintSelect";

export default async function BacklogPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const project = getProjectByKey(key);
  if (!project) notFound();

  const sprints = listSprints(project.id);
  const tickets = listTickets(project.id).sort(
    (a, b) => a.status.localeCompare(b.status) || a.number - b.number,
  );
  const open = sprints.filter((s) => s.status !== "completed");
  const completed = sprints.filter((s) => s.status === "completed").reverse();
  const hasActive = open.some((s) => s.status === "active");
  const bySprint = (id: number | null) => tickets.filter((t) => t.sprint_id === id);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4">
      <form
        action={createSprint.bind(null, project.id)}
        className="card flex flex-wrap items-end gap-2 p-3"
      >
        <div className="min-w-40 flex-1">
          <label className="label" htmlFor="s-name">New sprint</label>
          <input id="s-name" name="name" className="input" placeholder={`${project.key} Sprint ${sprints.length + 1}`} />
        </div>
        <div className="min-w-40 flex-[2]">
          <label className="label" htmlFor="s-goal">Goal</label>
          <input id="s-goal" name="goal" className="input" placeholder="What should this sprint achieve?" />
        </div>
        <SubmitButton className="btn-secondary">Create sprint</SubmitButton>
      </form>

      {open.map((s) => (
        <SprintSection
          key={s.id}
          sprint={s}
          tickets={bySprint(s.id)}
          projectKey={project.key}
          openSprints={open}
          canStart={!hasActive}
        />
      ))}

      <Section
        title="Backlog"
        subtitle="Tickets not in any sprint"
        tickets={bySprint(null)}
        projectKey={project.key}
        openSprints={open}
      />

      {completed.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-mute">
            Completed sprints ({completed.length})
          </summary>
          <ul className="mt-3 divide-y divide-line text-sm">
            {completed.map((s) => {
              const done = bySprint(s.id);
              return (
                <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-mute">
                    {s.start_date} → {s.end_date} · {done.length} tickets ·{" "}
                    {done.reduce((n, t) => n + (t.story_points ?? 0), 0)} pts delivered
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}

function SprintSection({
  sprint: s,
  tickets,
  projectKey,
  openSprints,
  canStart,
}: {
  sprint: Sprint;
  tickets: Ticket[];
  projectKey: string;
  openSprints: Sprint[];
  canStart: boolean;
}) {
  const done = tickets.filter((t) => t.status === "done").length;
  const actions =
    s.status === "active" ? (
      <ConfirmButton
        action={completeSprint.bind(null, s.id)}
        message={`Complete ${s.name}? ${tickets.length - done} unfinished ticket(s) will move back to the backlog.`}
        className="btn-primary"
      >
        Complete sprint
      </ConfirmButton>
    ) : (
      <>
        <ConfirmButton
          action={deleteSprint.bind(null, s.id)}
          message={`Delete ${s.name}? Its tickets move to the backlog.`}
          className="btn-ghost"
        >
          Delete
        </ConfirmButton>
        {canStart ? (
          <form action={startSprint.bind(null, s.id)}>
            <SubmitButton className="btn-secondary">Start sprint</SubmitButton>
          </form>
        ) : (
          <button className="btn-secondary" disabled title="Complete the active sprint first">
            Start sprint
          </button>
        )}
      </>
    );

  return (
    <Section
      title={s.name}
      badge={s.status === "active" ? "Active" : undefined}
      subtitle={[
        s.start_date && `${s.start_date} → ${s.end_date}`,
        s.goal,
        tickets.length > 0 && `${done}/${tickets.length} done`,
      ]
        .filter(Boolean)
        .join(" · ")}
      actions={actions}
      tickets={tickets}
      projectKey={projectKey}
      openSprints={openSprints}
    />
  );
}

function Section({
  title,
  subtitle,
  badge,
  actions,
  tickets,
  projectKey,
  openSprints,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  tickets: Ticket[];
  projectKey: string;
  openSprints: Sprint[];
}) {
  const points = tickets.reduce((n, t) => n + (t.story_points ?? 0), 0);
  return (
    <section className="card">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-neon/[0.03] px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="heading text-sm text-ice">{title}</h2>
            {badge && (
              <span className="bg-neon/20 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-widest text-neon-hi shadow-[0_0_10px_rgb(61_169_255/0.5)]">
                {badge}
              </span>
            )}
            <span className="text-xs text-mute">
              {tickets.length} tickets · {points} pts
            </span>
          </div>
          {subtitle && <p className="mt-0.5 truncate text-xs text-mute">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </header>
      {tickets.length === 0 ? (
        <p className="px-4 py-5 text-center text-sm text-mute/70">No tickets here yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-neon/5">
              <TypeIcon type={t.type} />
              <Link
                href={`/p/${projectKey}/t/${t.number}`}
                className="w-16 shrink-0 font-mono text-xs text-mute hover:underline"
              >
                {projectKey}-{t.number}
              </Link>
              <Link
                href={`/p/${projectKey}/t/${t.number}`}
                className={`min-w-0 flex-1 truncate hover:text-neon-hi ${t.status === "done" ? "text-mute/70 line-through" : ""}`}
              >
                {t.title}
              </Link>
              <StatusPill status={t.status} />
              <PriorityIcon priority={t.priority} />
              <span className="w-6 text-center text-xs text-mute">{t.story_points ?? "–"}</span>
              <Avatar id={t.assignee_id} name={t.assignee_name} size="sm" />
              <SprintSelect ticketId={t.id} sprintId={t.sprint_id} sprints={openSprints} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
