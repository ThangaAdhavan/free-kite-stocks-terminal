import { yahooSearch } from './_providers.js';
import { localSearch } from './_symbols.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.status(200).json([]);

    // Local results are instant and always available.
    const local = localSearch(q);

    // Try live provider search; merge & de-dupe (live first, then any local extras).
    let live = [];
    try {
      const quotes = await yahooSearch(q);
      if (quotes && quotes.length) {
        live = quotes
          .filter((x) => x.symbol)
          .map((x) => ({
            symbol: x.symbol,
            name: x.shortname || x.longname || x.symbol,
            type: x.quoteType || x.typeDisp || 'EQUITY',
            exchange: x.exchDisp || x.exchange || '',
          }));
      }
    } catch { /* ignore, fall back to local */ }

    const seen = new Set();
    const merged = [];
    for (const item of [...live, ...local]) {
      const key = item.symbol.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }

    return res.status(200).json(merged.slice(0, 12));
  } catch (err) {
    console.error('search error', err);
    // Even on error, return local results so search never appears broken.
    try {
      return res.status(200).json(localSearch((req.query.q || '').toString()));
    } catch {
      return res.status(200).json([]);
    }
  }
}
