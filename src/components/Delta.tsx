import { fmtPct, fmtNum } from '../lib/format';

export function Delta({ pct, abs, size = 'md' }: { pct?: number | null; abs?: number | null; size?: 'sm' | 'md' | 'lg' }) {
  const v = pct ?? 0;
  const up = v >= 0;
  const sz = size === 'lg' ? 'text-base px-2.5 py-1' : size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono2 font-bold border-2 border-[var(--border)] ${sz}`}
      style={{ background: up ? 'var(--color-bull)' : 'var(--color-bear)', color: '#0a0a0a' }}
    >
      {up ? '▲' : '▼'} {abs != null ? `${up ? '+' : ''}${fmtNum(abs)} ` : ''}{fmtPct(v)}
    </span>
  );
}
