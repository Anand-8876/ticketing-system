import { capitalize, statusLabel, type Priority, type Status, type TicketType } from "@/lib/types";

export function TypeIcon({ type }: { type: TicketType }) {
  const styles: Record<TicketType, { bg: string; path: React.ReactNode }> = {
    story: {
      bg: "bg-white",
      path: <path d="M5 3h6v10l-3-2-3 2z" fill="#030712" />,
    },
    task: {
      bg: "bg-neon",
      path: <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" fill="none" />,
    },
    bug: {
      bg: "bg-rose-500",
      path: <circle cx="8" cy="8" r="3.2" fill="white" />,
    },
  };
  const s = styles[type];
  return (
    <span
      title={capitalize(type)}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${s.bg} shadow-[0_0_6px_rgb(61_169_255/0.6)]`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4">
        {s.path}
      </svg>
    </span>
  );
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  const map: Record<Priority, { color: string; d: string }> = {
    urgent: { color: "text-rose-400", d: "M3 9l5-5 5 5M3 13l5-5 5 5" },
    high: { color: "text-amber-300", d: "M3 11l5-5 5 5" },
    medium: { color: "text-neon", d: "M3 6h10M3 10h10" },
    low: { color: "text-mute", d: "M3 5l5 5 5-5" },
  };
  const p = map[priority];
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 shrink-0 ${p.color}`}
      aria-label={`${capitalize(priority)} priority`}
    >
      <title>{`${capitalize(priority)} priority`}</title>
      <path d={p.d} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_STYLES: Record<Status, string> = {
  todo: "border-mute/50 text-mute",
  in_progress: "border-neon/70 bg-neon/15 text-neon-hi",
  review: "border-cyan-300/70 bg-cyan-300/10 text-cyan-200",
  done: "border-white/70 bg-white/10 text-white",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block whitespace-nowrap border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-widest ${STATUS_STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
