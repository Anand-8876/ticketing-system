import { Avatar } from "@/components/Avatar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listUsers } from "@/lib/queries";
import { parseDbDate } from "@/lib/types";
import { RoleSelect } from "./RoleSelect";

export default async function UsersPage() {
  const me = await requireUser();
  const users = listUsers();
  const counts = new Map(
    (
      db
        .prepare(
          `SELECT assignee_id AS id, COUNT(*) AS c FROM tickets
           WHERE status != 'done' AND assignee_id IS NOT NULL GROUP BY assignee_id`,
        )
        .all() as { id: number; c: number }[]
    ).map((r) => [r.id, r.c]),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="heading neon-text text-2xl font-bold">People</h1>
      <p className="mb-6 mt-1 text-sm text-mute">
        Teammates join by signing up at <code className="rounded bg-panel-2/70 px-1">/register</code>.
        {me.role === "admin" ? " As an admin you can change roles." : ""}
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left font-mono text-xs uppercase tracking-widest text-neon/80">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Open tickets</th>
              <th className="px-4 py-2.5">Joined</th>
              <th className="px-4 py-2.5">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar id={u.id} name={u.name} size="sm" />
                    <span className="font-medium">{u.name}</span>
                    {u.id === me.id && <span className="text-xs text-mute/70">(you)</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-mute">{u.email}</td>
                <td className="px-4 py-2.5">{counts.get(u.id) ?? 0}</td>
                <td className="px-4 py-2.5 text-mute">
                  {parseDbDate(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  {me.role === "admin" ? (
                    <RoleSelect userId={u.id} role={u.role} />
                  ) : (
                    <span className="capitalize">{u.role}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
