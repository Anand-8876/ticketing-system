const COLORS = [
  "bg-blue-600",
  "bg-sky-600",
  "bg-indigo-600",
  "bg-cyan-700",
  "bg-blue-800",
  "bg-sky-800",
  "bg-indigo-800",
  "bg-cyan-900",
];

export function Avatar({
  id,
  name,
  size = "md",
}: {
  id: number | null;
  name: string | null;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  if (id == null || !name) {
    return (
      <span
        title="Unassigned"
        className={`${dims} inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-mute/60 text-mute/70`}
      >
        ?
      </span>
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      title={name}
      className={`${dims} ${COLORS[id % COLORS.length]} inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold text-white ring-1 ring-neon/60 shadow-[0_0_8px_rgb(61_169_255/0.45)]`}
    >
      {initials}
    </span>
  );
}
