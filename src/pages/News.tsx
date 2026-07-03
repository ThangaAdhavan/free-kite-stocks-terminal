import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { timeAgo } from '../lib/format';

const FILTERS = ['All', 'Positive', 'Negative', 'Neutral'];

export default function News() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try { const d = await fetch('/api/news').then((r) => r.json()); if (alive) setItems(d || []); }
      catch { if (alive) setItems([]); }
      finally { if (alive) setLoading(false); }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const filtered = filter === 'All' ? items : items.filter((i) => i.sentiment === filter.toLowerCase());

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2"><Newspaper /> Financial News</h1>
      <p className="text-muted font-mono2 text-sm mt-1">Aggregated headlines with AI sentiment · refreshes every 60s</p></div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-bold border-2 border-[var(--border)] ${filter === f ? 'bg-[var(--ink)] text-[var(--bg-card)]' : 'bg-[var(--bg-card)]'}`}>{f}</button>)}
      </div>

      {loading ? <div className="grid md:grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        : filtered.length === 0 ? (
        <div className="nb bg-[var(--bg-card)] p-10 text-center text-muted">No news matching this filter.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((n, i) => (
            <motion.a key={i} href={n.link} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="nb nb-hover bg-[var(--bg-card)] p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-muted">{n.publisher}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 border-2 border-[var(--border)]" style={{ background: n.sentiment === 'positive' ? 'var(--color-bull)' : n.sentiment === 'negative' ? 'var(--color-bear)' : 'transparent', color: n.sentiment === 'neutral' ? 'var(--muted)' : '#0a0a0a' }}>{n.sentiment}</span>
              </div>
              <h3 className="font-bold text-[15px] mt-2 leading-snug">{n.title}</h3>
              {n.summary && <p className="text-xs text-muted mt-2 line-clamp-2">{n.summary}</p>}
              <div className="flex items-center gap-2 mt-auto pt-3 text-[11px] text-muted">
                <span>{timeAgo(n.published)}</span>
                {n.related?.length > 0 && <div className="flex gap-1 ml-auto">{n.related.slice(0, 3).map((s: string) => <Link key={s} to={`/stock/${s}`} onClick={(e) => e.stopPropagation()} className="font-mono2 font-bold border-2 border-[var(--border)] px-1.5">{s}</Link>)}</div>}
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
