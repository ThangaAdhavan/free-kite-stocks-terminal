import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Bell, Plus, Globe, MapPin, User, ArrowLeft, Loader2, Check } from 'lucide-react';
import PriceChart from '../components/PriceChart';
import AIResearch from '../components/AIResearch';
import SectionCard from '../components/SectionCard';
import { Delta } from '../components/Delta';
import { Skeleton } from '../components/Skeleton';
import { fmtPrice, fmtNum, fmtCompact, fmtMoneyCompact, timeAgo } from '../lib/format';
import { useAuthFetch } from '../lib/useApi';

export default function StockDetail() {
  const { symbol = '' } = useParams();
  const nav = useNavigate();
  const authFetch = useAuthFetch();
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [watched, setWatched] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(false); setP(null);
    const load = async () => {
      try {
        const [prof, nw] = await Promise.all([
          fetch(`/api/profile?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()),
          fetch(`/api/news?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()),
        ]);
        if (!alive) return;
        if (prof.error || prof.price == null) setErr(true); else setP(prof);
        setNews((nw || []).slice(0, 8));
      } catch { if (alive) setErr(true); }
      finally { if (alive) setLoading(false); }
    };
    load();
    authFetch('/api/watchlist').then((rows) => alive && setWatched(rows.some((r: any) => r.symbol === symbol))).catch(() => {});
    const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [symbol]);

  const toggleWatch = async () => {
    try {
      if (watched) { await authFetch('/api/watchlist', { method: 'DELETE', body: JSON.stringify({ symbol }) }); setWatched(false); }
      else { await authFetch('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol, name: p?.name, type: 'EQUITY', sector: p?.sector }) }); setWatched(true); }
    } catch { /* ignore */ }
  };

  const addAlert = async () => {
    try {
      await authFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ symbol, name: p?.name, alert_type: 'move_5', threshold: 5 }) });
      setAdded(true); setTimeout(() => setAdded(false), 2000);
    } catch { /* ignore */ }
  };

  if (loading) return (
    <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-[440px] w-full" /></div>
  );
  if (err || !p) return (
    <div className="nb bg-[var(--bg-card)] p-10 text-center">
      <p className="font-mono2 text-lg mb-3">Could not load <b>{symbol}</b></p>
      <button onClick={() => nav('/')} className="nb-sm nb-press px-4 py-2 font-bold bg-[var(--accent)] text-[#0a0a0a]">Back to Dashboard</button>
    </div>
  );

  const stats = [
    ['Prev Close', fmtPrice(p.previousClose)], ['Open', fmtPrice(p.open)],
    ['Day Low', fmtPrice(p.dayLow)], ['Day High', fmtPrice(p.dayHigh)],
    ['52W Low', fmtPrice(p.fiftyTwoWeekLow)], ['52W High', fmtPrice(p.fiftyTwoWeekHigh)],
    ['Volume', fmtCompact(p.volume)], ['Avg Volume', fmtCompact(p.avgVolume)],
    ['Market Cap', fmtMoneyCompact(p.marketCap)], ['P/E', p.pe ? fmtNum(p.pe) : '—'],
    ['EPS', p.eps ? fmtPrice(p.eps) : '—'], ['Beta', p.beta ? fmtNum(p.beta) : '—'],
    ['Div Yield', p.dividendYield ? (p.dividendYield * 100).toFixed(2) + '%' : '—'],
    ['Target', p.targetMean ? fmtPrice(p.targetMean) : '—'],
  ];

  return (
    <div className="space-y-5">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-bold text-muted hover:text-[var(--ink)]"><ArrowLeft size={16} /> Back</button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="nb bg-[var(--bg-card)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 border-[3px] border-[var(--border)] bg-white grid place-items-center overflow-hidden shrink-0">
            {p.logo ? <img src={p.logo} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="font-mono2 font-bold">{symbol.slice(0, 2)}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{p.name}</h1>
              <span className="font-mono2 font-bold text-sm border-2 border-[var(--border)] px-2 py-0.5">{symbol}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              {p.sector && <span className="font-bold border-2 border-[var(--border)] px-2 py-0.5">{p.sector}</span>}
              {p.industry && <span className="text-muted border-2 border-[var(--border)] px-2 py-0.5">{p.industry}</span>}
              {p.exchange && <span className="text-muted">{p.exchange}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono2 font-black text-3xl">{fmtPrice(p.price)}</div>
            <div className="mt-1 flex justify-end"><Delta pct={p.changePercent} abs={p.change} size="lg" /></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={toggleWatch} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold nb-sm nb-press ${watched ? 'bg-[var(--accent)] text-[#0a0a0a]' : 'bg-[var(--bg-card)]'}`}>
            <Star size={15} fill={watched ? '#0a0a0a' : 'none'} /> {watched ? 'Watching' : 'Add to Watchlist'}
          </button>
          <button onClick={addAlert} className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold nb-sm nb-press bg-[var(--accent2)] text-white">
            {added ? <><Check size={15} /> Alert Set</> : <><Bell size={15} /> Set ±5% Alert</>}
          </button>
          {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold nb-sm nb-press bg-[var(--bg-card)]"><Globe size={15} /> Website</a>}
        </div>
      </motion.div>

      {/* Chart */}
      <PriceChart symbol={symbol} />

      {/* Stats grid */}
      <SectionCard title="Key Statistics">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          {stats.map(([k, v], i) => (
            <div key={i} className="p-3 border-r-2 border-b-2 border-[var(--border)]">
              <div className="text-[11px] font-bold uppercase text-muted">{k}</div>
              <div className="font-mono2 font-bold text-sm mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Profile */}
        <SectionCard title="Company Profile">
          <div className="p-4 space-y-3 text-sm">
            {p.description && <p className="leading-relaxed text-[13px]">{p.description.slice(0, 500)}{p.description.length > 500 ? '…' : ''}</p>}
            <div className="space-y-2 pt-2">
              {p.ceo && <div className="flex items-center gap-2"><User size={15} className="text-muted" /><span className="text-muted">CEO:</span> <b>{p.ceo}</b></div>}
              {p.headquarters && <div className="flex items-center gap-2"><MapPin size={15} className="text-muted" /><span className="text-muted">HQ:</span> <b>{p.headquarters}</b></div>}
              {p.employees && <div className="flex items-center gap-2"><User size={15} className="text-muted" /><span className="text-muted">Employees:</span> <b>{fmtCompact(p.employees)}</b></div>}
              {p.website && <div className="flex items-center gap-2"><Globe size={15} className="text-muted" /><a href={p.website} target="_blank" rel="noreferrer" className="underline font-bold truncate">{p.website.replace(/^https?:\/\//, '')}</a></div>}
            </div>
          </div>
        </SectionCard>
        {/* News */}
        <SectionCard title="Latest News" right={<Plus size={14} className="opacity-0" />}>
          {news.length === 0 ? <div className="p-6 text-center text-muted text-sm">No recent news.</div> : news.map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block px-4 py-3 border-b-2 border-[var(--border)] last:border-0 hover:bg-[var(--accent)] hover:text-[#0a0a0a]">
              <div className="text-sm font-bold line-clamp-2">{n.title}</div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted"><span>{n.publisher}</span><span>·</span><span>{timeAgo(n.published)}</span></div>
            </a>
          ))}
        </SectionCard>
      </div>

      {/* AI Research */}
      <AIResearch symbol={symbol} />
    </div>
  );
}
