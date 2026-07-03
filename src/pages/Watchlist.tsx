import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, Search, ArrowUpDown, Loader2 } from 'lucide-react';
import { Delta } from '../components/Delta';
import { Skeleton } from '../components/Skeleton';
import { fmtPrice, fmtCompact } from '../lib/format';
import { useAuthFetch } from '../lib/useApi';

interface Row { id: number; symbol: string; name: string; sector?: string; type?: string; price?: number; changePercent?: number; change?: number; volume?: number; }

export default function Watchlist() {
  const authFetch = useAuthFetch();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [sort, setSort] = useState<'name' | 'change' | 'price'>('change');
  const [grouped, setGrouped] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const list = await authFetch('/api/watchlist');
      if (list.length) {
        const q = await fetch(`/api/quote?symbols=${list.map((r: any) => r.symbol).join(',')}`).then((r) => r.json());
        setRows(list.map((r: any) => ({ ...r, ...(q[r.symbol] || {}) })));
      } else setRows([]);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const data = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json());
      setResults((data || []).slice(0, 6));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const add = async (r: any) => {
    setBusy(true);
    try { await authFetch('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol: r.symbol, name: r.name, type: r.type, sector: r.sector }) }); setQ(''); setResults([]); await load(); } catch {}
    setBusy(false);
  };
  const remove = async (symbol: string) => { await authFetch('/api/watchlist', { method: 'DELETE', body: JSON.stringify({ symbol }) }); setRows((x) => x.filter((r) => r.symbol !== symbol)); };

  const sorted = [...rows].sort((a, b) => {
    if (sort === 'name') return a.symbol.localeCompare(b.symbol);
    if (sort === 'price') return (b.price || 0) - (a.price || 0);
    return (b.changePercent || 0) - (a.changePercent || 0);
  });

  const groups: Record<string, Row[]> = {};
  if (grouped) for (const r of sorted) (groups[r.sector || 'Uncategorized'] ||= []).push(r);

  const RowItem = ({ r }: { r: Row }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-[var(--border)] last:border-0">
      <Link to={`/stock/${encodeURIComponent(r.symbol)}`} className="min-w-0 flex-1">
        <div className="font-mono2 font-bold text-sm">{r.symbol}</div>
        <div className="text-xs text-muted truncate">{r.name}</div>
      </Link>
      {r.volume != null && <div className="hidden sm:block text-xs font-mono2 text-muted">Vol {fmtCompact(r.volume)}</div>}
      <div className="text-right"><div className="font-mono2 font-bold text-sm">{fmtPrice(r.price)}</div><Delta pct={r.changePercent} size="sm" /></div>
      <button onClick={() => remove(r.symbol)} className="nb-sm nb-press w-8 h-8 grid place-items-center bg-[var(--color-bear)] text-white"><Trash2 size={14} /></button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2"><Star className="text-[var(--accent)]" fill="var(--accent)" /> Watchlist</h1>
        <p className="text-muted font-mono2 text-sm mt-1">Synced across devices · {rows.length} instruments</p></div>
      </div>

      {/* Search + add */}
      <div className="relative max-w-lg">
        <div className="flex items-center gap-2 nb-sm bg-[var(--bg-card)] px-3 py-2.5">
          <Search size={16} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search and add stocks, ETFs, crypto…" className="bg-transparent outline-none flex-1 text-sm font-mono2" />
          {busy && <Loader2 size={16} className="animate-spin" />}
        </div>
        {results.length > 0 && (
          <div className="absolute z-30 mt-2 w-full nb bg-[var(--bg-card)]">
            {results.map((r) => (
              <button key={r.symbol} onClick={() => add(r)} className="w-full flex items-center justify-between px-3 py-2.5 border-b-2 border-[var(--border)] last:border-0 hover:bg-[var(--accent)] hover:text-[#0a0a0a]">
                <div className="text-left"><div className="font-mono2 font-bold text-sm">{r.symbol}</div><div className="text-xs opacity-70">{r.name}</div></div>
                <span className="text-[10px] font-bold border-2 border-[var(--border)] px-1.5">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {(['change', 'price', 'name'] as const).map((s) => (
          <button key={s} onClick={() => setSort(s)} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold border-2 border-[var(--border)] ${sort === s ? 'bg-[var(--ink)] text-[var(--bg-card)]' : 'bg-[var(--bg-card)]'}`}><ArrowUpDown size={13} /> {s}</button>
        ))}
        <button onClick={() => setGrouped((g) => !g)} className={`px-3 py-1.5 text-xs font-bold border-2 border-[var(--border)] ${grouped ? 'bg-[var(--accent2)] text-white' : 'bg-[var(--bg-card)]'}`}>Group by sector</button>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        : rows.length === 0 ? (
        <div className="nb bg-[var(--bg-card)] p-10 text-center text-muted">Your watchlist is empty. Search above to add instruments.</div>
      ) : grouped ? (
        <div className="space-y-4">{Object.entries(groups).map(([sec, list]) => (
          <div key={sec} className="nb bg-[var(--bg-card)]">
            <div className="px-4 py-2 border-b-[3px] border-[var(--border)] bg-[var(--accent)] text-[#0a0a0a] font-mono2 font-bold text-sm uppercase">{sec}</div>
            {list.map((r) => <RowItem key={r.id} r={r} />)}
          </div>
        ))}</div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="nb bg-[var(--bg-card)]">{sorted.map((r) => <RowItem key={r.id} r={r} />)}</motion.div>
      )}
    </div>
  );
}
