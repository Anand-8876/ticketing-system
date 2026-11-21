import Link from "next/link";
import { logout } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-neon/40 bg-panel/80 backdrop-blur-md shadow-[0_1px_20px_rgb(61_169_255/0.25)]">
        <div className="flex h-14 items-center gap-2 px-4">
          <Link href="/" className="heading neon-text mr-4 flex items-center gap-2 text-sm font-bold">
            <Logo className="h-6 w-6" /> TicketFlow
          </Link>
          <Link href="/" className="btn-ghost">Projects</Link>
          <Link href="/users" className="btn-ghost">People</Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-neon">{user.role}</div>
            </div>
            <Avatar id={user.id} name={user.name} />
            <form action={logout}>
              <button className="btn-ghost">Log out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
