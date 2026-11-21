import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { listProjects } from "@/lib/queries";
import { NewProjectForm } from "./NewProjectForm";

export default function ProjectsPage() {
  const projects = listProjects();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading neon-text text-2xl font-bold">Projects</h1>
        <NewProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="card p-10 text-center text-mute">
          No projects yet. Create one to start tracking tickets.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const done = p.ticket_count - p.open_count;
            const pct = p.ticket_count ? Math.round((done / p.ticket_count) * 100) : 0;
            return (
              <Link
                key={p.id}
                href={`/p/${p.key}`}
                className="card group flex flex-col p-5 transition hover:border-neon/70 hover:shadow-[0_0_14px_rgb(61_169_255/0.3)]-[0_0_24px_rgb(61_169_255/0.25)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="heading text-sm font-semibold text-white group-hover:text-neon-hi">{p.name}</div>
                    <div className="font-mono text-xs text-mute">{p.key}</div>
                  </div>
                  <Avatar id={p.lead_id} name={p.lead_name} size="sm" />
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-mute">
                  {p.description || "No description."}
                </p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-mute">
                    <span>{p.open_count} open</span>
                    <span>{done}/{p.ticket_count} done</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-panel-2/70">
                    <div className="h-full rounded-full bg-neon shadow-[0_0_8px_#3da9ff]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
