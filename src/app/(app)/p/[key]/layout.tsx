import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject } from "@/app/actions";
import { ConfirmButton } from "@/components/Buttons";
import { requireUser } from "@/lib/auth";
import { getProjectByKey, listSprints, listUsers } from "@/lib/queries";
import { CreateTicketButton } from "./CreateTicketButton";
import { ProjectTabs } from "./ProjectTabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const user = await requireUser();
  const project = getProjectByKey(key);
  if (!project) notFound();

  const openSprints = listSprints(project.id).filter((s) => s.status !== "completed");
  const active = openSprints.find((s) => s.status === "active");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-line bg-panel/60 px-4 pt-4 backdrop-blur-sm">
        <div className="text-xs text-mute">
          <Link href="/" className="hover:underline">Projects</Link> / {project.name}
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="heading text-xl font-bold text-white">
            {project.name} <span className="font-mono text-sm font-normal tracking-widest text-neon">{project.key}</span>
          </h1>
          <div className="flex items-center gap-2">
            {user.role === "admin" && (
              <ConfirmButton
                action={deleteProject.bind(null, project.id)}
                message={`Delete ${project.name} and all its tickets? This cannot be undone.`}
              >
                Delete project
              </ConfirmButton>
            )}
            <CreateTicketButton
              projectId={project.id}
              users={listUsers()}
              sprints={openSprints}
              defaultSprintId={active?.id ?? null}
            />
          </div>
        </div>
        <ProjectTabs projectKey={project.key} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
