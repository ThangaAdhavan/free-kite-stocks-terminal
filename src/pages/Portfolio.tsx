import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Trash2, Search, X, Loader2 } from 'lucide-react';
import { Delta } from '../components/Delta';
import { Skeleton } from '../components/Skeleton';
import { fmtPrice, fmtMoneyCompact } from '../lib/format';
import { useAuthFetch } from '../lib/useApi';

interface Holding { id: number; symbol: string; name: string; quantity: number; buy_price: number; sector?: string; price?: number; changePercent?: number; }

const SECTOR_COLORS = ['#4d61ff', '#16c784', '#ff5c8a', '#ffb703', '#a855f7', '#fb8500', '#00b4d8', '#ea3943'];

export default function Portfolio() {
  const authFetch = useAuthFetch();
  const [rows, setRows] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [q, setQ] = useState(''); const [results, setResults] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null); const [qty, setQty] = useState(''); const [bp, setBp] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const list = await authFetch('/api/portfolio');
      if (list.length) {
        const qd = await fetch(`/api/quote?symbols=${list.map((r: any) => r.symbol).join(',')}`).then((r) => r.json());
        setRows(list.map((r: any) => ({ ...r, price: qd[r.symbol]?.price, changePercent: qd[r.symbol]?.changePercent })));
      } else setRows([]);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => { const d = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()); setResults((d || []).slice(0, 6)); }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const submit = async () => {
    setErr('');
    if (!sel) { setErr('Pick an instrument.'); return; }
    const quantity = parseFloat(qty), buy_price = parseFloat(bp);
    if (!quantity || quantity <= 0) { setErr('Enter a valid quantity.'); return; }
    if (!buy_price || buy_price <= 0) { setErr('Enter a valid buy price.'); return; }
    await authFetch('/api/portfolio', { method: 'POST', body: JSON.stringify({ symbol: sel.symbol, name: sel.name, quantity, buy_price, sector: sel.sector }) });
    setModal(false); setSel(null); setQty(''); setBp(''); setQ(''); await load();
  };
  const remove = async (id: number) => { await authFetch('/api/portfolio', { method: 'DELETE', body: JSON.stringify({ id }) }); setRows((x) => x.filter((r) => r.id !== id)); };

  const enriched = rows.map((r) => {
    const cur = r.price ?? r.buy_price;
    const cost = r.buy_price * r.quantity;
    const value = cur * r.quantity;
    const pl = value - cost;
    const plPct = cost ? (pl / cost) * 100 : 0;
    return { ...r, cur, cost, value, pl, plPct };
  });
  const totalValue = enriched.reduce((a, r) => a + r.value, 0);
  const totalCost = enriched.reduce((a, r) => a + r.cost, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost ? (totalPL / totalCost) * 100 : 0;
  const dayPL = enriched.reduce((a, r) => a + (r.value * ((r.changePercent || 0) / 100)), 0);

  // allocation
  const alloc = enriched.map((r, i) => ({ symbol: r.symbol, value: r.value, pct: totalValue ? (r.value / totalValue) * 100 : 0, color: SECTOR_COLORS[i % SECTOR_COLORS.length] }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2"><Briefcase className="text-[var(--accent2)]" /> Portfolio</h1>
        <p className="text-muted font-mono2 text-sm mt-1">{rows.length} holdings · live valued</p></div>
        <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 font-bold nb-sm nb-press bg-[var(--accent)] text-[#0a0a0a]"><Plus size={16} /> Add Holding</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Value" value={fmtPrice(totalValue)} />
        <Stat label="Total Cost" value={fmtPrice(totalCost)} />
        <div className="nb bg-[var(--bg-card)] p-4"><div className="text-[11px] font-bold uppercase text-muted">Total P/L</div><div className="font-mono2 font-black text-lg mt-1" style={{ color: totalPL >= 0 ? 'var(--color-bull)' : 'var(--color-bear)' }}>{totalPL >= 0 ? '+' : ''}{fmtPrice(totalPL)}</div><div className="mt-1"><Delta pct={totalPLPct} size="sm" /></div></div>
        <div className="nb bg-[var(--bg-card)] p-4"><div className="text-[11px] font-bold uppercase text-muted">Day's Gain</div><div className="font-mono2 font-black text-lg mt-1" style={{ color: dayPL >= 0 ? 'var(--color-bull)' : 'var(--color-bear)' }}>{dayPL >= 0 ? '+' : ''}{fmtPrice(dayPL)}</div></div>
      </div>

      {loading ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? (
        <div className="nb bg-[var(--bg-card)] p-10 text-center text-muted">No holdings yet. Add your first position to track P/L.</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Holdings table */}
          <div className="lg:col-span-2 nb bg-[var(--bg-card)] overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b-[3px] border-[var(--border)] bg-[var(--accent)] text-[#0a0a0a]">
                {['Symbol', 'Qty', 'Buy', 'Price', 'Value', 'P/L', ''].map((h) => <th key={h} className="text-left font-mono2 font-bold text-xs uppercase px-3 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {enriched.map((r) => (
                  <tr key={r.id} className="border-b-2 border-[var(--border)] last:border-0">
                    <td className="px-3 py-2"><Link to={`/stock/${r.symbol}`} className="font-mono2 font-bold hover:underline">{r.symbol}</Link></td>
                    <td className="px-3 py-2 font-mono2">{r.quantity}</td>
                    <td className="px-3 py-2 font-mono2">{fmtPrice(r.buy_price)}</td>
                    <td className="px-3 py-2 font-mono2">{fmtPrice(r.cur)}</td>
                    <td className="px-3 py-2 font-mono2 font-bold">{fmtPrice(r.value)}</td>
                    <td className="px-3 py-2"><span className="font-mono2 font-bold" style={{ color: r.pl >= 0 ? 'var(--color-bull)' : 'var(--color-bear)' }}>{r.pl >= 0 ? '+' : ''}{fmtPrice(r.pl)} ({r.plPct.toFixed(1)}%)</span></td>
                    <td className="px-3 py-2"><button onClick={() => remove(r.id)} className="text-[var(--color-bear)]"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Allocation */}
          <div className="nb bg-[var(--bg-card)] p-4">
            <h3 className="font-mono2 font-bold text-sm uppercase mb-3">Allocation</h3>
            <div className="flex h-4 w-full border-2 border-[var(--border)] overflow-hidden mb-3">
              {alloc.map((a) => <div key={a.symbol} style={{ width: a.pct + '%', background: a.color }} title={`${a.symbol} ${a.pct.toFixed(1)}%`} />)}
            </div>
            <div className="space-y-1.5">
              {alloc.sort((a, b) => b.pct - a.pct).map((a) => (
                <div key={a.symbol} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 border-2 border-[var(--border)]" style={{ background: a.color }} />
                  <span className="font-mono2 font-bold">{a.symbol}</span>
                  <span className="ml-auto font-mono2">{a.pct.toFixed(1)}%</span>
                  <span className="text-muted text-xs">{fmtMoneyCompact(a.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="nb bg-[var(--bg-card)] w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-black text-xl">Add Holding</h3><button onClick={() => setModal(false)}><X /></button></div>
            {!sel ? (
              <div className="relative">
                <div className="flex items-center gap-2 nb-sm px-3 py-2.5"><Search size={16} className="text-muted" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search instrument…" className="bg-transparent outline-none flex-1 text-sm font-mono2" /></div>
                {results.length > 0 && <div className="mt-2 nb-sm max-h-56 overflow-auto">{results.map((r) => <button key={r.symbol} onClick={() => { setSel(r); setResults([]); }} className="w-full text-left px-3 py-2 border-b-2 border-[var(--border)] last:border-0 hover:bg-[var(--accent)] hover:text-[#0a0a0a]"><span className="font-mono2 font-bold">{r.symbol}</span> <span className="text-xs opacity-70">{r.name}</span></button>)}</div>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between nb-sm px-3 py-2"><span className="font-mono2 font-bold">{sel.symbol}</span><button onClick={() => setSel(null)} className="text-xs underline">change</button></div>
                <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" placeholder="Quantity" className="w-full nb-sm px-3 py-2.5 bg-[var(--bg-card)] outline-none text-sm font-mono2" />
                <input value={bp} onChange={(e) => setBp(e.target.value)} type="number" placeholder="Buy price ($)" className="w-full nb-sm px-3 py-2.5 bg-[var(--bg-card)] outline-none text-sm font-mono2" />
                {err && <div className="text-xs font-bold p-2 border-2 border-[var(--border)]" style={{ background: 'var(--color-bear)', color: '#fff' }}>{err}</div>}
                <button onClick={submit} className="w-full py-3 font-bold nb-sm nb-press bg-[var(--accent)] text-[#0a0a0a]">Add to Portfolio</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="nb bg-[var(--bg-card)] p-4"><div className="text-[11px] font-bold uppercase text-muted">{label}</div><div className="font-mono2 font-black text-lg mt-1">{value}</div></div>;
}
