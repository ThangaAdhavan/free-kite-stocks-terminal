import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface R { symbol: string; name: string; type: string; exchange?: string; }

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<R[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) { setRes([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json());
        setRes(Array.isArray(data) ? data.slice(0, 10) : []);
        setOpen(true); setActive(0);
      } catch { /* ignore */ }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const go = (sym: string) => { setQ(''); setRes([]); setOpen(false); nav(`/stock/${encodeURIComponent(sym)}`); };

  return (
    <div ref={ref} className={`relative ${compact ? 'w-full' : 'w-full max-w-md'}`}>
      <div className="flex items-center gap-2 nb-sm bg-[var(--bg-card)] px-3 py-2">
        <Search size={16} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => res.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, res.length - 1));
            else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
            else if (e.key === 'Enter' && res[active]) go(res[active].symbol);
          }}
          placeholder="Search stocks, ETFs, crypto, forex…"
          className="bg-transparent outline-none flex-1 text-sm font-mono2 placeholder:text-muted"
        />
        {q && <button onClick={() => { setQ(''); setRes([]); }}><X size={15} className="text-muted" /></button>}
      </div>
      {open && res.length > 0 && (
        <div className="absolute z-50 mt-2 w-full nb bg-[var(--bg-card)] max-h-80 overflow-auto">
          {res.map((r, i) => (
            <button
              key={r.symbol + i}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.symbol)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left border-b-2 border-[var(--border)] last:border-0 ${i === active ? 'bg-[var(--accent)] text-[#0a0a0a]' : ''}`}
            >
              <div className="min-w-0">
                <div className="font-mono2 font-bold text-sm">{r.symbol}</div>
                <div className="text-xs truncate opacity-70">{r.name}</div>
              </div>
              <span className="text-[10px] font-bold border-2 border-[var(--border)] px-1.5 py-0.5 uppercase">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
