import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectByKey, listSprints, listTickets, listUsers } from "@/lib/queries";
import { Board } from "./Board";

export default async function BoardPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const project = getProjectByKey(key);
  if (!project) notFound();

  const sprints = listSprints(project.id);
  const active = sprints.find((s) => s.status === "active");
  const completed = new Set(sprints.filter((s) => s.status === "completed").map((s) => s.id));
  // Scrum-style when a sprint is running; otherwise a plain kanban of everything still open.
  const tickets = listTickets(project.id).filter((t) =>
    active ? t.sprint_id === active.id : t.sprint_id == null || !completed.has(t.sprint_id),
  );

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 text-sm text-mute">
        {active ? (
          <>
            <span className="heading text-xs font-semibold text-white">{active.name}</span>
            {active.end_date && <> · ends {active.end_date}</>}
            {active.goal && <> · <span className="italic">{active.goal}</span></>}
          </>
        ) : (
          <>
            No active sprint, so the board shows every open ticket.{" "}
            <Link href={`/p/${project.key}/backlog`} className="text-neon hover:underline">
              Plan a sprint →
            </Link>
          </>
        )}
      </div>
      <Board projectKey={project.key} tickets={tickets} users={listUsers()} />
    </div>
  );
}
