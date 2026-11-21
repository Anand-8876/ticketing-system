import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="heading neon-text mb-8 flex items-center gap-3 text-3xl font-black">
        <Logo className="h-9 w-9" /> TicketFlow
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
