import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, TrendingDown, Activity, Grid3x3, Newspaper, Star, Loader2 } from 'lucide-react';
import SectionCard from '../components/SectionCard';
import StockRow from '../components/StockRow';
import Heatmap from '../components/Heatmap';
import MarketStatus from '../components/MarketStatus';
import { Delta } from '../components/Delta';
import { Skeleton } from '../components/Skeleton';
import { fmtNum, fmtPct, timeAgo } from '../lib/format';
import { useAuthFetch } from '../lib/useApi';

interface Mover { symbol: string; name: string; price: number; change: number; changePercent: number; volume: number; marketCap: number; sector: string; }
interface Idx { symbol: string; name: string; price: number; change: number; changePercent: number; }

export default function Dashboard() {
  const authFetch = useAuthFetch();
  const [indices, setIndices] = useState<Idx[]>([]);
  const [movers, setMovers] = useState<{ gainers: Mover[]; losers: Mover[]; active: Mover[]; trending: Mover[]; heatmap: Mover[] } | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [watch, setWatch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWatch = async () => {
    try {
      const rows = await authFetch('/api/watchlist');
      if (rows.length) {
        const syms = rows.map((r: any) => r.symbol).join(',');
        const q = await fetch(`/api/quote?symbols=${encodeURIComponent(syms)}`).then((r) => r.json());
        setWatch(rows.map((r: any) => ({ ...r, ...(q[r.symbol] || {}) })));
      } else setWatch([]);
    } catch { setWatch([]); }
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [idx, mv, nw] = await Promise.all([
          fetch('/api/market?category=indices').then((r) => r.json()),
          fetch('/api/movers').then((r) => r.json()),
          fetch('/api/news').then((r) => r.json()),
        ]);
        if (!alive) return;
        setIndices(idx || []); setMovers(mv); setNews((nw || []).slice(0, 6));
      } catch { /* ignore */ }
      finally { if (alive) setLoading(false); }
    };
    load(); loadWatch();
    const t = setInterval(() => { load(); loadWatch(); }, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Market Overview</h1>
          <p className="text-muted font-mono2 text-sm mt-1">Live data · auto-refresh every 30s</p>
        </div>
        <MarketStatus />
      </div>

      {/* Indices */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          : indices.map((idx, i) => (
          <motion.div key={idx.symbol} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="nb nb-hover bg-[var(--bg-card)] p-3">
            <div className="text-xs font-bold uppercase text-muted">{idx.name}</div>
            <div className="font-mono2 font-black text-lg mt-1">{fmtNum(idx.price)}</div>
            <div className="mt-1"><Delta pct={idx.changePercent} size="sm" /></div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Trending */}
        <SectionCard title="Trending" icon={<Flame size={16} />} accent="var(--accent)">
          {!movers ? <ListSkeleton /> : movers.trending.slice(0, 8).map((m) => <StockRow key={m.symbol} {...m} />)}
        </SectionCard>
        {/* Gainers */}
        <SectionCard title="Top Gainers" icon={<TrendingUp size={16} />} accent="var(--color-bull)">
          {!movers ? <ListSkeleton /> : movers.gainers.slice(0, 8).map((m) => <StockRow key={m.symbol} {...m} />)}
        </SectionCard>
        {/* Losers */}
        <SectionCard title="Top Losers" icon={<TrendingDown size={16} />} accent="var(--color-bear)">
          {!movers ? <ListSkeleton /> : movers.losers.slice(0, 8).map((m) => <StockRow key={m.symbol} {...m} />)}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Most Active */}
        <SectionCard title="Most Active" icon={<Activity size={16} />} accent="var(--accent2)">
          {!movers ? <ListSkeleton /> : movers.active.slice(0, 8).map((m) => <StockRow key={m.symbol} {...m} volume={m.volume} />)}
        </SectionCard>
        {/* Watchlist */}
        <SectionCard title="Your Watchlist" icon={<Star size={16} />} accent="var(--accent3)"
          right={<Link to="/watchlist" className="text-[11px] font-bold underline">Manage</Link>}>
          {watch.length === 0 ? (
            <div className="p-6 text-center text-muted text-sm">No stocks yet. <Link to="/watchlist" className="underline font-bold">Add some →</Link></div>
          ) : watch.slice(0, 8).map((m) => <StockRow key={m.symbol} symbol={m.symbol} name={m.name} price={m.price} changePercent={m.changePercent} change={m.change} />)}
        </SectionCard>
        {/* News */}
        <SectionCard title="Financial News" icon={<Newspaper size={16} />}
          right={<Link to="/news" className="text-[11px] font-bold underline">All →</Link>}>
          {loading ? <ListSkeleton /> : news.map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noreferrer" className="block px-3 py-2.5 border-b-2 border-[var(--border)] last:border-0 hover:bg-[var(--accent)] hover:text-[#0a0a0a]">
              <div className="text-sm font-bold line-clamp-2">{n.title}</div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                <span>{n.publisher}</span><span>·</span><span>{timeAgo(n.published)}</span>
                <span className="ml-auto font-bold px-1.5 border-2 border-[var(--border)]" style={{ background: n.sentiment === 'positive' ? 'var(--color-bull)' : n.sentiment === 'negative' ? 'var(--color-bear)' : 'transparent', color: n.sentiment === 'neutral' ? 'var(--muted)' : '#0a0a0a' }}>{n.sentiment}</span>
              </div>
            </a>
          ))}
        </SectionCard>
      </div>

      {/* Heatmap */}
      <SectionCard title="Market Heatmap" icon={<Grid3x3 size={16} />} accent="var(--accent)">
        {!movers ? <div className="p-6"><Loader2 className="animate-spin mx-auto" /></div> : <Heatmap items={movers.heatmap} />}
      </SectionCard>
    </div>
  );
}

function ListSkeleton() {
  return <div className="p-3 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>;
}
