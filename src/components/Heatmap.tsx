import { Link } from 'react-router-dom';
import { fmtPct } from '../lib/format';

interface Item { symbol: string; changePercent: number; marketCap: number; sector: string; }

function color(pct: number) {
  const c = Math.max(-4, Math.min(4, pct));
  if (c >= 0) { const a = 0.25 + (c / 4) * 0.7; return `rgba(22,199,132,${a})`; }
  const a = 0.25 + (Math.abs(c) / 4) * 0.7; return `rgba(234,57,67,${a})`;
}

export default function Heatmap({ items }: { items: Item[] }) {
  const bySector: Record<string, Item[]> = {};
  for (const it of items) { (bySector[it.sector] ||= []).push(it); }
  const sectors = Object.entries(bySector).sort((a, b) => b[1].length - a[1].length);
  return (
    <div className="p-3 space-y-3">
      {sectors.map(([sector, list]) => (
        <div key={sector}>
          <div className="text-[11px] font-bold uppercase text-muted mb-1">{sector}</div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
            {list.sort((a, b) => b.marketCap - a.marketCap).map((it) => (
              <Link key={it.symbol} to={`/stock/${it.symbol}`}
                className="border-2 border-[var(--border)] px-1.5 py-2 text-center"
                style={{ background: color(it.changePercent), color: '#0a0a0a' }}>
                <div className="font-mono2 font-bold text-[11px] leading-none">{it.symbol}</div>
                <div className="font-mono2 text-[10px] font-bold mt-0.5">{fmtPct(it.changePercent)}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
