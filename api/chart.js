import { yahooChart, stooqHistory } from './_providers.js';

const RANGE_MAP = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  'YTD': { range: 'ytd', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
  'MAX': { range: 'max', interval: '1mo' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const symbol = (req.query.symbol || '').toString();
    const rangeKey = (req.query.range || '1M').toString().toUpperCase();
    if (!symbol) return res.status(400).json({ error: 'symbol required' });
    const { range, interval } = RANGE_MAP[rangeKey] || RANGE_MAP['1M'];

    let data = await yahooChart(symbol, range, interval);
    if (!data || !data.candles.length) {
      data = await stooqHistory(symbol);
    }
    if (!data || !data.candles.length) {
      return res.status(404).json({ error: 'no data', candles: [] });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('chart error', err);
    return res.status(500).json({ error: err.message });
  }
}
