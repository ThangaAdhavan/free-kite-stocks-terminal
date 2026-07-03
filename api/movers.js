import { yahooQuoteViaChart } from './_providers.js';

async function mapPool(items, fn, concurrency = 12) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

const UNIVERSE = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','AVGO','JPM','V','WMT','MA','JNJ','PG','HD',
  'COST','ORCL','ABBV','BAC','KO','CRM','AMD','NFLX','ADBE','PEP','CSCO','TMO','MCD','ACN','LIN',
  'INTC','QCOM','TXN','DIS','WFC','PFE','NKE','INTU','IBM','GE','BA','UBER','SHOP','PYPL','SQ',
  'PLTR','SOFI','COIN','SNAP','F','GM','T','VZ','XOM','CVX','MRNA','ABNB','RBLX','DKNG',
];

const SECTORS = {
  AAPL:'Technology',MSFT:'Technology',NVDA:'Technology',AVGO:'Technology',ORCL:'Technology',CRM:'Technology',AMD:'Technology',ADBE:'Technology',CSCO:'Technology',INTC:'Technology',QCOM:'Technology',TXN:'Technology',INTU:'Technology',IBM:'Technology',PLTR:'Technology',
  AMZN:'Consumer Cyclical',TSLA:'Consumer Cyclical',HD:'Consumer Cyclical',MCD:'Consumer Cyclical',NKE:'Consumer Cyclical',DIS:'Consumer Cyclical',UBER:'Consumer Cyclical',ABNB:'Consumer Cyclical',F:'Consumer Cyclical',GM:'Consumer Cyclical',RBLX:'Consumer Cyclical',DKNG:'Consumer Cyclical',
  GOOGL:'Communication',META:'Communication',NFLX:'Communication',T:'Communication',VZ:'Communication',SNAP:'Communication',
  JPM:'Financials',V:'Financials',MA:'Financials',BAC:'Financials',WFC:'Financials',PYPL:'Financials',SQ:'Financials',SOFI:'Financials',COIN:'Financials',
  JNJ:'Healthcare',ABBV:'Healthcare',TMO:'Healthcare',PFE:'Healthcare',MRNA:'Healthcare',
  PG:'Consumer Defensive',WMT:'Consumer Defensive',COST:'Consumer Defensive',KO:'Consumer Defensive',PEP:'Consumer Defensive',
  XOM:'Energy',CVX:'Energy',
  BA:'Industrials',GE:'Industrials',ACN:'Industrials',SHOP:'Technology',LIN:'Materials',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const all = (await mapPool(UNIVERSE, (s) => yahooQuoteViaChart(s).catch(() => null))).filter(Boolean);

    const mapped = all
      .filter((r) => r.regularMarketPrice != null)
      .map((r) => ({
        symbol: r.symbol,
        name: r.shortName || r.longName || r.symbol,
        price: r.regularMarketPrice,
        change: r.regularMarketChange || 0,
        changePercent: r.regularMarketChangePercent || 0,
        volume: r.regularMarketVolume || 0,
        marketCap: r.marketCap || 0,
        sector: SECTORS[r.symbol] || 'Other',
      }));

    const gainers = [...mapped].sort((a, b) => b.changePercent - a.changePercent).slice(0, 12);
    const losers = [...mapped].sort((a, b) => a.changePercent - b.changePercent).slice(0, 12);
    const active = [...mapped].sort((a, b) => b.volume - a.volume).slice(0, 12);
    const trending = [...mapped].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 12);

    return res.status(200).json({ gainers, losers, active, trending, heatmap: mapped });
  } catch (err) {
    console.error('movers error', err);
    return res.status(500).json({ error: err.message });
  }
}
