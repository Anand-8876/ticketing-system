export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden style={{ filter: "drop-shadow(0 0 4px #3da9ff)" }}>
      <path d="M6 2h16v16l-4 4H2V6z" fill="none" stroke="#3da9ff" strokeWidth="1.6" />
      <path d="M7 8h10M7 12h7M7 16h4" stroke="white" strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  );
}
