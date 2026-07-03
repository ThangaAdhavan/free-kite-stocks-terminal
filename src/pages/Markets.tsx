import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Delta } from '../components/Delta';
import { Skeleton } from '../components/Skeleton';
import { fmtPrice, fmtMoneyCompact, fmtCompact } from '../lib/format';

const TABS = [
  { key: 'indices', label: 'Indices' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'commodities', label: 'Commodities' },
  { key: 'forex', label: 'Forex' },
  { key: 'bonds', label: 'Bonds' },
];

export default function Markets() {
  const [tab, setTab] = useState('indices');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true; setLoading(true);
    const load = async () => {
      try {
        const url = tab === 'crypto' ? '/api/crypto' : `/api/market?category=${tab}`;
        const data = await fetch(url).then((r) => r.json());
        if (alive) setRows(Array.isArray(data) ? data : []);
      } catch { if (alive) setRows([]); }
      finally { if (alive) setLoading(false); }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [tab]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Global Markets</h1>
        <p className="text-muted font-mono2 text-sm mt-1">Stocks, ETFs, indices, commodities, forex, crypto & bonds</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 text-sm font-bold border-2 border-[var(--border)] nb-press ${tab === t.key ? 'bg-[var(--accent2)] text-white' : 'bg-[var(--bg-card)]'}`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="nb bg-[var(--bg-card)] p-10 text-center text-muted">No data available right now. Try again shortly.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r, i) => (
            <motion.div key={r.symbol} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/stock/${encodeURIComponent(r.symbol)}`} className="nb nb-hover bg-[var(--bg-card)] p-4 flex items-center gap-3">
                {r.image && <img src={r.image} alt="" className="w-9 h-9" />}
                <div className="min-w-0 flex-1">
                  <div className="font-mono2 font-bold">{r.name}</div>
                  <div className="text-xs text-muted font-mono2">{r.symbol}</div>
                  {r.marketCap != null && <div className="text-[11px] text-muted mt-0.5">Mkt Cap {fmtMoneyCompact(r.marketCap)}{r.volume ? ` · Vol ${fmtCompact(r.volume)}` : ''}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono2 font-black">{fmtPrice(r.price)}</div>
                  <div className="mt-1"><Delta pct={r.changePercent} size="sm" /></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
