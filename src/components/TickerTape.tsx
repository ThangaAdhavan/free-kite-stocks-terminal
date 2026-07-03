import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtPct } from '../lib/format';

interface T { symbol: string; name: string; price: number; changePercent: number; }

export default function TickerTape() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const [idx, cmd] = await Promise.all([
          fetch('/api/market?category=indices').then((r) => r.json()),
          fetch('/api/market?category=crypto').then((r) => r.json()),
        ]);
        setItems([...(idx || []), ...(cmd || [])].filter((x) => x.price != null));
      } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  if (!items.length) return <div className="h-9 border-b-[3px] border-[var(--border)] bg-[var(--accent)]" />;
  const doubled = [...items, ...items];
  return (
    <div className="h-9 overflow-hidden border-b-[3px] border-[var(--border)] bg-[var(--accent)] text-[#0a0a0a]">
      <div className="marquee-track h-full items-center">
        {doubled.map((t, i) => (
          <Link key={i} to={`/stock/${encodeURIComponent(t.symbol)}`} className="inline-flex items-center gap-2 px-4 font-mono2 text-xs font-bold">
            <span>{t.name}</span>
            <span>{t.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span style={{ color: (t.changePercent ?? 0) >= 0 ? '#0a7d4b' : '#b3161f' }}>{fmtPct(t.changePercent)}</span>
            <span className="opacity-40">/</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
