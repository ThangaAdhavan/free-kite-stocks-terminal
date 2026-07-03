import { yahooQuote, stooqQuote } from './_providers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const symbolsParam = (req.query.symbols || req.query.symbol || '').toString();
    if (!symbolsParam) return res.status(400).json({ error: 'symbols required' });
    const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);

    // Primary: Yahoo batch quote
    let results = await yahooQuote(symbols);
    const out = {};

    if (results && results.length) {
      for (const r of results) {
        out[r.symbol] = normalizeYahoo(r);
      }
    }

    // Failover for any missing symbols -> Stooq
    const missing = symbols.filter((s) => !out[s]);
    for (const s of missing) {
      const sq = await stooqQuote(s);
      if (sq) {
        const change = sq.regularMarketPrice - (sq.regularMarketPreviousClose || sq.regularMarketPrice);
        out[s] = {
          symbol: s,
          name: s,
          price: sq.regularMarketPrice,
          open: sq.regularMarketOpen,
          dayHigh: sq.regularMarketDayHigh,
          dayLow: sq.regularMarketDayLow,
          volume: sq.regularMarketVolume,
          previousClose: sq.regularMarketPreviousClose,
          change,
          changePercent: sq.regularMarketPreviousClose ? (change / sq.regularMarketPreviousClose) * 100 : 0,
          currency: 'USD',
          source: 'stooq',
        };
      }
    }

    return res.status(200).json(out);
  } catch (err) {
    console.error('quote error', err);
    return res.status(500).json({ error: err.message });
  }
}

function normalizeYahoo(r) {
  return {
    symbol: r.symbol,
    name: r.shortName || r.longName || r.symbol,
    price: r.regularMarketPrice,
    change: r.regularMarketChange,
    changePercent: r.regularMarketChangePercent,
    open: r.regularMarketOpen,
    dayHigh: r.regularMarketDayHigh,
    dayLow: r.regularMarketDayLow,
    previousClose: r.regularMarketPreviousClose,
    volume: r.regularMarketVolume,
    avgVolume: r.averageDailyVolume3Month,
    marketCap: r.marketCap,
    fiftyTwoWeekHigh: r.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow,
    pe: r.trailingPE,
    eps: r.epsTrailingTwelveMonths,
    currency: r.currency || 'USD',
    exchange: r.fullExchangeName,
    marketState: r.marketState,
    source: 'yahoo',
  };
}
