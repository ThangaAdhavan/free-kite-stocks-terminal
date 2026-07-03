export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }

export function sma(data: Candle[], period: number) {
  const out: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += data[j].close;
    out.push({ time: data[i].time, value: s / period });
  }
  return out;
}

export function ema(data: Candle[], period: number) {
  const out: { time: number; value: number }[] = [];
  if (!data.length) return out;
  const k = 2 / (period + 1);
  let prev = data[0].close;
  for (let i = 0; i < data.length; i++) {
    prev = i === 0 ? data[0].close : data[i].close * k + prev * (1 - k);
    if (i >= period - 1) out.push({ time: data[i].time, value: prev });
  }
  return out;
}

export function rsi(data: Candle[], period = 14) {
  const out: { time: number; value: number }[] = [];
  if (data.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = data[i].close - data[i - 1].close;
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period; loss /= period;
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i].close - data[i - 1].close;
    gain = (gain * (period - 1) + (d > 0 ? d : 0)) / period;
    loss = (loss * (period - 1) + (d < 0 ? -d : 0)) / period;
    const rs = loss === 0 ? 100 : gain / loss;
    out.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
  }
  return out;
}

export function bollinger(data: Candle[], period = 20, mult = 2) {
  const upper: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, c) => a + c.close, 0) / period;
    const variance = slice.reduce((a, c) => a + (c.close - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper.push({ time: data[i].time, value: mean + mult * sd });
    lower.push({ time: data[i].time, value: mean - mult * sd });
  }
  return { upper, lower };
}

export function vwap(data: Candle[]) {
  const out: { time: number; value: number }[] = [];
  let cumPV = 0, cumV = 0;
  for (const c of data) {
    const tp = (c.high + c.low + c.close) / 3;
    cumPV += tp * (c.volume || 1);
    cumV += c.volume || 1;
    out.push({ time: c.time, value: cumV ? cumPV / cumV : c.close });
  }
  return out;
}
