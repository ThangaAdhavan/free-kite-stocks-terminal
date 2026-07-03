import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Trash2, Search, X, Mail } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { useAuthFetch } from '../lib/useApi';
import { useAuth } from '../contexts/AuthContext';

const TYPES = [
  { key: 'move_3', label: '±3% Move' }, { key: 'move_5', label: '±5% Move' }, { key: 'move_10', label: '±10% Move' },
  { key: 'target_above', label: 'Target Above' }, { key: 'target_below', label: 'Target Below' },
  { key: 'volume_spike', label: 'Volume Spike' }, { key: 'high_52w', label: '52W High' }, { key: 'low_52w', label: '52W Low' },
  { key: 'rsi_cross', label: 'RSI Cross' }, { key: 'macd_cross', label: 'MACD Cross' }, { key: 'ma_cross', label: 'MA Crossover' },
];
const LABELS: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.key, t.label]));

export default function Alerts() {
  const authFetch = useAuthFetch();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [q, setQ] = useState(''); const [results, setResults] = useState<any[]>([]); const [sel, setSel] = useState<any>(null);
  const [type, setType] = useState('move_5'); const [threshold, setThreshold] = useState(''); const [err, setErr] = useState('');

  const load = async () => { try { setRows(await authFetch('/api/alerts')); } catch { setRows([]); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => { const d = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json()); setResults((d || []).slice(0, 6)); }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const needsThreshold = ['target_above', 'target_below'].includes(type);
  const submit = async () => {
    setErr('');
    if (!sel) { setErr('Pick an instrument.'); return; }
    if (needsThreshold && !parseFloat(threshold)) { setErr('Enter a target price.'); return; }
    await authFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ symbol: sel.symbol, name: sel.name, alert_type: type, threshold: needsThreshold ? parseFloat(threshold) : null }) });
    setModal(false); setSel(null); setQ(''); setThreshold(''); await load();
  };
  const toggle = async (id: number, active: boolean) => { await authFetch('/api/alerts', { method: 'PUT', body: JSON.stringify({ id, active: !active }) }); load(); };
  const remove = async (id: number) => { await authFetch('/api/alerts', { method: 'DELETE', body: JSON.stringify({ id }) }); setRows((x) => x.filter((r) => r.id !== id)); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2"><Bell className="text-[var(--accent3)]" /> Alerts</h1>
        <p className="text-muted font-mono2 text-sm mt-1 flex items-center gap-1"><Mail size={14} /> Notifications sent to {user?.email}</p></div>
        <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 font-bold nb-sm nb-press bg-[var(--accent)] text-[#0a0a0a]"><Plus size={16} /> New Alert</button>
      </div>

      <div className="nb bg-[var(--accent2)] text-white p-4 flex items-start gap-3">
        <Mail size={20} className="shrink-0 mt-0.5" />
        <p className="text-sm">Unlimited price alerts. When a trigger fires, a Gmail notification is dispatched containing the company, symbol, current price, % change, trigger time and a direct link. Duplicate notifications are suppressed automatically.</p>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        : rows.length === 0 ? (
        <div className="nb bg-[var(--bg-card)] p-10 text-center text-muted">No alerts configured. Create one to get Gmail notifications.</div>
      ) : (
        <div className="nb bg-[var(--bg-card)]">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b-2 border-[var(--border)] last:border-0">
              <div className="min-w-0 flex-1">
                <div className="font-mono2 font-bold text-sm">{r.symbol} <span className="text-muted font-normal">· {r.name}</span></div>
                <div className="text-xs text-muted mt-0.5">{LABELS[r.alert_type] || r.alert_type}{r.threshold ? ` @ $${r.threshold}` : ''}</div>
              </div>
              <button onClick={() => toggle(r.id, r.active)} className={`text-[11px] font-bold border-2 border-[var(--border)] px-2 py-1 ${r.active ? 'bg-[var(--color-bull)] text-[#0a0a0a]' : 'bg-[var(--bg-card)] text-muted'}`}>{r.active ? 'ACTIVE' : 'PAUSED'}</button>
              <button onClick={() => remove(r.id)} className="nb-sm nb-press w-8 h-8 grid place-items-center bg-[var(--color-bear)] text-white"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="nb bg-[var(--bg-card)] w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-black text-xl">New Alert</h3><button onClick={() => setModal(false)}><X /></button></div>
            <div className="space-y-3">
              {!sel ? (
                <div className="relative">
                  <div className="flex items-center gap-2 nb-sm px-3 py-2.5"><Search size={16} className="text-muted" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search instrument…" className="bg-transparent outline-none flex-1 text-sm font-mono2" /></div>
                  {results.length > 0 && <div className="mt-2 nb-sm max-h-56 overflow-auto">{results.map((r) => <button key={r.symbol} onClick={() => { setSel(r); setResults([]); }} className="w-full text-left px-3 py-2 border-b-2 border-[var(--border)] last:border-0 hover:bg-[var(--accent)] hover:text-[#0a0a0a]"><span className="font-mono2 font-bold">{r.symbol}</span> <span className="text-xs opacity-70">{r.name}</span></button>)}</div>}
                </div>
              ) : (
                <div className="flex items-center justify-between nb-sm px-3 py-2"><span className="font-mono2 font-bold">{sel.symbol}</span><button onClick={() => setSel(null)} className="text-xs underline">change</button></div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => <button key={t.key} onClick={() => setType(t.key)} className={`px-2 py-2 text-xs font-bold border-2 border-[var(--border)] ${type === t.key ? 'bg-[var(--accent2)] text-white' : 'bg-[var(--bg-card)]'}`}>{t.label}</button>)}
              </div>
              {needsThreshold && <input value={threshold} onChange={(e) => setThreshold(e.target.value)} type="number" placeholder="Target price ($)" className="w-full nb-sm px-3 py-2.5 bg-[var(--bg-card)] outline-none text-sm font-mono2" />}
              {err && <div className="text-xs font-bold p-2 border-2 border-[var(--border)]" style={{ background: 'var(--color-bear)', color: '#fff' }}>{err}</div>}
              <button onClick={submit} className="w-full py-3 font-bold nb-sm nb-press bg-[var(--accent)] text-[#0a0a0a]">Create Alert</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
