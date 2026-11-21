import Link from "next/link";
import { notFound } from "next/navigation";
import { addComment, deleteComment, deleteTicket } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { ConfirmButton, SubmitButton } from "@/components/Buttons";
import { TypeIcon } from "@/components/Icons";
import { requireUser } from "@/lib/auth";
import { getProjectByKey, getTicket, listComments, listSprints, listUsers } from "@/lib/queries";
import { parseDbDate, timeAgo } from "@/lib/types";
import { TicketForm } from "./TicketForm";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ key: string; num: string }>;
}) {
  const { key, num } = await params;
  const me = await requireUser();
  const project = getProjectByKey(key);
  if (!project) notFound();
  const ticket = getTicket(project.id, Number(num));
  if (!ticket) notFound();

  const comments = listComments(ticket.id);
  const sprints = listSprints(project.id).filter(
    (s) => s.status !== "completed" || s.id === ticket.sprint_id,
  );

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center gap-2 text-sm text-mute">
        <Link href={`/p/${project.key}`} className="hover:underline">Board</Link>
        <span>/</span>
        <TypeIcon type={ticket.type} />
        <span className="font-mono tracking-wider text-neon">{project.key}-{ticket.number}</span>
        <div className="ml-auto">
          <ConfirmButton
            action={deleteTicket.bind(null, ticket.id)}
            message={`Delete ${project.key}-${ticket.number}? This cannot be undone.`}
          >
            Delete
          </ConfirmButton>
        </div>
      </div>

      <TicketForm ticket={ticket} users={listUsers()} sprints={sprints} />

      <p className="mt-3 text-xs text-mute">
        Reported by {ticket.reporter_name ?? "a deleted user"} · created{" "}
        <time title={parseDbDate(ticket.created_at).toLocaleString()}>{timeAgo(ticket.created_at)}</time> · updated{" "}
        <time title={parseDbDate(ticket.updated_at).toLocaleString()}>{timeAgo(ticket.updated_at)}</time>
      </p>

      <section className="mt-8 max-w-3xl">
        <h2 className="heading mb-3 text-sm font-semibold text-neon-hi">Comments ({comments.length})</h2>
        <form action={addComment.bind(null, ticket.id)} className="mb-5 flex gap-3">
          <Avatar id={me.id} name={me.name} />
          <div className="flex-1 space-y-2">
            <textarea name="body" rows={2} required className="input" placeholder="Add a comment…" />
            <SubmitButton pendingText="Saving…">Comment</SubmitButton>
          </div>
        </form>
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar id={c.author_id} name={c.author_name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{c.author_name ?? "Deleted user"}</span>
                  <time className="text-xs text-mute" title={parseDbDate(c.created_at).toLocaleString()}>
                    {timeAgo(c.created_at)}
                  </time>
                  {(c.author_id === me.id || me.role === "admin") && (
                    <form action={deleteComment.bind(null, c.id)} className="ml-auto">
                      <button className="text-xs text-mute/70 hover:text-rose-400">Delete</button>
                    </form>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ice">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
