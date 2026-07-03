function status() {
  const now = new Date();
  const utc = now.getUTCHours() * 60 + now.getUTCMinutes();
  const day = now.getUTCDay();
  // NYSE 9:30-16:00 ET = 13:30-20:00 UTC (approx, ignoring DST edge)
  const open = 13 * 60 + 30, close = 20 * 60;
  if (day === 0 || day === 6) return { label: 'CLOSED · WEEKEND', open: false };
  if (utc >= open && utc < close) return { label: 'MARKET OPEN', open: true };
  if (utc < open) return { label: 'PRE-MARKET', open: false };
  return { label: 'AFTER HOURS', open: false };
}

export default function MarketStatus() {
  const s = status();
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold border-2 border-[var(--border)] px-2 py-1" style={{ background: s.open ? 'var(--color-bull)' : 'var(--bg-card)', color: s.open ? '#0a0a0a' : 'var(--ink)' }}>
      <span className={`w-2 h-2 rounded-full ${s.open ? 'bg-[#0a0a0a] animate-pulse' : 'bg-[var(--muted)]'}`} />
      {s.label}
    </span>
  );
}
