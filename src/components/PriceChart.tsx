import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { useTheme } from '../contexts/ThemeContext';
import { sma, ema, bollinger, vwap } from '../lib/indicators';
import type { Candle } from '../lib/indicators';
import { Skeleton } from './Skeleton';

const RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'MAX'];
const TYPES = ['Candles', 'Line', 'Area'] as const;
const OVERLAYS = ['SMA 50', 'EMA 20', 'Bollinger', 'VWAP', 'Volume'] as const;

export default function PriceChart({ symbol }: { symbol: string }) {
  const { dark } = useTheme();
  const box = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [range, setRange] = useState('6M');
  const [type, setType] = useState<typeof TYPES[number]>('Candles');
  const [ov, setOv] = useState<Record<string, boolean>>({ 'SMA 50': true, Volume: true });
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(false);
    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then((r) => r.json())
      .then((d) => { if (!alive) return; if (d.candles?.length) setCandles(d.candles); else setErr(true); })
      .catch(() => alive && setErr(true))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [symbol, range]);

  useEffect(() => {
    if (!box.current || !candles.length) return;
    const ink = dark ? '#f2f0e9' : '#0a0a0a';
    const grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,10,0.07)';
    const chart = createChart(box.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: ink, fontFamily: 'Space Mono, monospace' },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      rightPriceScale: { borderColor: ink },
      timeScale: { borderColor: ink, timeVisible: range === '1D' || range === '5D' },
      crosshair: { mode: 1 },
      autoSize: true,
    });
    chartRef.current = chart;

    const data = candles.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close, value: c.close }));
    const up = candles.length && candles[candles.length - 1].close >= candles[0].close;

    if (type === 'Candles') {
      const s = chart.addSeries(CandlestickSeries, { upColor: '#16c784', downColor: '#ea3943', borderUpColor: '#0a0a0a', borderDownColor: '#0a0a0a', wickUpColor: '#16c784', wickDownColor: '#ea3943' });
      s.setData(data as any);
    } else if (type === 'Line') {
      const s = chart.addSeries(LineSeries, { color: up ? '#16c784' : '#ea3943', lineWidth: 2 });
      s.setData(candles.map((c) => ({ time: c.time as any, value: c.close })));
    } else {
      const s = chart.addSeries(AreaSeries, { lineColor: up ? '#16c784' : '#ea3943', topColor: up ? 'rgba(22,199,132,0.4)' : 'rgba(234,57,67,0.4)', bottomColor: 'rgba(0,0,0,0)', lineWidth: 2 });
      s.setData(candles.map((c) => ({ time: c.time as any, value: c.close })));
    }

    if (ov['Volume']) {
      const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
      vs.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      vs.setData(candles.map((c) => ({ time: c.time as any, value: c.volume, color: c.close >= c.open ? 'rgba(22,199,132,0.5)' : 'rgba(234,57,67,0.5)' })));
    }
    if (ov['SMA 50']) { const s = chart.addSeries(LineSeries, { color: '#4d61ff', lineWidth: 2 }); s.setData(sma(candles, 50) as any); }
    if (ov['EMA 20']) { const s = chart.addSeries(LineSeries, { color: '#ff8c00', lineWidth: 2 }); s.setData(ema(candles, 20) as any); }
    if (ov['Bollinger']) {
      const b = bollinger(candles);
      const u = chart.addSeries(LineSeries, { color: 'rgba(255,92,138,0.8)', lineWidth: 1 }); u.setData(b.upper as any);
      const l = chart.addSeries(LineSeries, { color: 'rgba(255,92,138,0.8)', lineWidth: 1 }); l.setData(b.lower as any);
    }
    if (ov['VWAP']) { const s = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2 }); s.setData(vwap(candles) as any); }

    chart.timeScale().fitContent();
    return () => { chart.remove(); chartRef.current = null; };
  }, [candles, type, ov, dark, range]);

  return (
    <div className="nb bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-2 py-1 text-xs font-mono2 font-bold border-2 border-[var(--border)] ${range === r ? 'bg-[var(--accent2)] text-white' : 'bg-[var(--bg-card)]'}`}>{r}</button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={`px-2 py-1 text-xs font-bold border-2 border-[var(--border)] ${type === t ? 'bg-[var(--accent)] text-[#0a0a0a]' : 'bg-[var(--bg-card)]'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {OVERLAYS.map((o) => (
          <button key={o} onClick={() => setOv((s) => ({ ...s, [o]: !s[o] }))} className={`px-2 py-0.5 text-[11px] font-bold border-2 border-[var(--border)] ${ov[o] ? 'bg-[var(--ink)] text-[var(--bg-card)]' : 'bg-[var(--bg-card)] text-muted'}`}>{o}</button>
        ))}
      </div>
      {loading ? <Skeleton className="h-[380px] w-full" />
        : err ? <div className="h-[380px] grid place-items-center text-muted font-mono2">No chart data available</div>
        : <div ref={box} className="h-[380px] w-full" />}
    </div>
  );
}
