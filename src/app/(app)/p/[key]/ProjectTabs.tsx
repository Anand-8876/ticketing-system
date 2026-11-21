"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabs({ projectKey }: { projectKey: string }) {
  const pathname = usePathname();
  const base = `/p/${projectKey}`;
  const tabs = [
    { href: base, label: "Board", active: pathname === base },
    { href: `${base}/backlog`, label: "Backlog & sprints", active: pathname.startsWith(`${base}/backlog`) },
  ];
  return (
    <nav className="mt-3 flex gap-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`border-b-2 px-3 py-2 font-mono text-xs uppercase tracking-widest ${
            t.active
              ? "border-neon text-white [text-shadow:0_0_8px_#3da9ff]"
              : "border-transparent text-mute hover:text-ice"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
