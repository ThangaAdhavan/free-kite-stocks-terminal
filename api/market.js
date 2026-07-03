import { yahooQuote } from './_providers.js';

const INDICES = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
const COMMODITIES = ['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F'];
const FOREX = ['EURUSD=X', 'GBPUSD=X', 'JPY=X', 'USDCAD=X'];
const CRYPTO = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD'];
const BONDS = ['^TNX', '^TYX', '^FVX'];

const LABELS = {
  '^GSPC': 'S&P 500', '^DJI': 'Dow Jones', '^IXIC': 'Nasdaq', '^RUT': 'Russell 2000', '^VIX': 'VIX',
  'GC=F': 'Gold', 'SI=F': 'Silver', 'CL=F': 'Crude Oil', 'NG=F': 'Natural Gas', 'HG=F': 'Copper',
  'EURUSD=X': 'EUR/USD', 'GBPUSD=X': 'GBP/USD', 'JPY=X': 'USD/JPY', 'USDCAD=X': 'USD/CAD',
  'BTC-USD': 'Bitcoin', 'ETH-USD': 'Ethereum', 'SOL-USD': 'Solana', 'BNB-USD': 'BNB',
  '^TNX': '10Y Treasury', '^TYX': '30Y Treasury', '^FVX': '5Y Treasury',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const category = (req.query.category || 'indices').toString();
    const sets = { indices: INDICES, commodities: COMMODITIES, forex: FOREX, crypto: CRYPTO, bonds: BONDS };
    const symbols = sets[category] || INDICES;
    const results = await yahooQuote(symbols);
    const out = (results || []).map((r) => ({
      symbol: r.symbol,
      name: LABELS[r.symbol] || r.shortName || r.symbol,
      price: r.regularMarketPrice,
      change: r.regularMarketChange,
      changePercent: r.regularMarketChangePercent,
      currency: r.currency || 'USD',
    })).filter((x) => x.price != null);
    return res.status(200).json(out);
  } catch (err) {
    console.error('market error', err);
    return res.status(500).json({ error: err.message });
  }
}
