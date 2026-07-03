import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, TrendingUp, TrendingDown, ShieldAlert, FileText, Target } from 'lucide-react';

interface Research {
  summary: string; financial: string[]; technical: string[];
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  bullCase: string[]; bearCase: string[]; risk: string[]; thesis: string;
}

const TABS = ['Summary', 'Financials', 'SWOT', 'Technical', 'Bull/Bear', 'Risk', 'Thesis'];

export default function AIResearch({ symbol }: { symbol: string }) {
  const [data, setData] = useState<Research | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState('Summary');

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(false);
    fetch(`/api/ai-research?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) { if (d.error) setErr(true); else setData(d); } })
      .catch(() => alive && setErr(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [symbol]);

  return (
    <div className="nb bg-[var(--bg-card)]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b-[3px] border-[var(--border)]" style={{ background: 'linear-gradient(90deg, var(--accent2), var(--accent3))', color: '#fff' }}>
        <Brain size={18} strokeWidth={2.5} />
        <h3 className="font-mono2 font-bold text-sm uppercase">AI Research Engine</h3>
        <span className="ml-auto text-[10px] font-bold border-2 border-white px-1.5 py-0.5">LIVE-DATA</span>
      </div>

      {loading ? (
        <div className="p-10 flex flex-col items-center gap-2 text-muted"><Loader2 className="animate-spin" /><span className="font-mono2 text-sm">Analyzing fundamentals & technicals…</span></div>
      ) : err || !data ? (
        <div className="p-10 text-center text-muted font-mono2 text-sm">AI research unavailable for this asset.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 p-3 border-b-2 border-[var(--border)]">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-2.5 py-1 text-xs font-bold border-2 border-[var(--border)] ${tab === t ? 'bg-[var(--ink)] text-[var(--bg-card)]' : 'bg-[var(--bg-card)]'}`}>{t}</button>
            ))}
          </div>
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-sm leading-relaxed space-y-2">
            {tab === 'Summary' && <p>{data.summary}</p>}
            {tab === 'Financials' && <ul className="space-y-2">{data.financial.map((f, i) => <li key={i} className="flex gap-2"><span className="text-[var(--accent2)] font-bold">▪</span>{f}</li>)}</ul>}
            {tab === 'Technical' && <ul className="space-y-2">{data.technical.map((f, i) => <li key={i} className="flex gap-2"><span className="text-[var(--accent2)] font-bold">▪</span>{f}</li>)}</ul>}
            {tab === 'SWOT' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {([['Strengths', data.swot.strengths, 'var(--color-bull)'], ['Weaknesses', data.swot.weaknesses, 'var(--color-bear)'], ['Opportunities', data.swot.opportunities, 'var(--accent2)'], ['Threats', data.swot.threats, 'var(--accent3)']] as const).map(([label, list, c]) => (
                  <div key={label} className="border-2 border-[var(--border)] p-3">
                    <div className="font-bold text-xs uppercase mb-2 px-2 py-0.5 inline-block" style={{ background: c, color: '#0a0a0a' }}>{label}</div>
                    <ul className="space-y-1 text-[13px]">{list.map((x, i) => <li key={i}>• {x}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
            {tab === 'Bull/Bear' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="border-2 border-[var(--border)] p-3">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-2 px-2 py-0.5 w-fit" style={{ background: 'var(--color-bull)', color: '#0a0a0a' }}><TrendingUp size={13}/> Bull Case</div>
                  <ul className="space-y-1.5 text-[13px]">{data.bullCase.map((x, i) => <li key={i}>• {x}</li>)}</ul>
                </div>
                <div className="border-2 border-[var(--border)] p-3">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-2 px-2 py-0.5 w-fit" style={{ background: 'var(--color-bear)', color: '#0a0a0a' }}><TrendingDown size={13}/> Bear Case</div>
                  <ul className="space-y-1.5 text-[13px]">{data.bearCase.map((x, i) => <li key={i}>• {x}</li>)}</ul>
                </div>
              </div>
            )}
            {tab === 'Risk' && <ul className="space-y-2">{data.risk.map((f, i) => <li key={i} className="flex gap-2"><ShieldAlert size={16} className="text-[var(--accent3)] shrink-0 mt-0.5" />{f}</li>)}</ul>}
            {tab === 'Thesis' && <div className="flex gap-2"><Target size={18} className="text-[var(--accent2)] shrink-0 mt-0.5" /><p className="font-medium">{data.thesis}</p></div>}
            <div className="pt-3 flex items-center gap-1 text-[11px] text-muted border-t-2 border-[var(--border)] mt-3"><FileText size={12} /> Generated from live fundamentals & price data. Not investment advice.</div>
          </motion.div>
        </>
      )}
    </div>
  );
}
