// Free market data providers with automatic failover.
// No API keys required for the primary path (Stooq + Yahoo public endpoints + CoinGecko).

const UA = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

const YAHOO_HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];

async function tryFetch(url, opts = {}, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, headers: { ...UA, ...(opts.headers || {}) } });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    return null;
  }
}

// Try a Yahoo path across both hosts; returns parsed JSON or null.
async function yahooJson(path) {
  for (const host of YAHOO_HOSTS) {
    const res = await tryFetch(host + path);
    if (res && res.ok) {
      const j = await res.json().catch(() => null);
      if (j) return j;
    }
  }
  return null;
}

// ---------- Yahoo Finance (public v8 chart + v7 quote) ----------
export async function yahooChart(symbol, range = '1mo', interval = '1d') {
  const j = await yahooJson(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`);
  const r = j?.chart?.result?.[0];
  if (!r) return null;
  const ts = r.timestamp || [];
  const q = r.indicators?.quote?.[0] || {};
  const meta = r.meta || {};
  const candles = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
    if (c == null) continue;
    candles.push({
      time: ts[i],
      open: o ?? c, high: h ?? c, low: l ?? c, close: c, volume: v ?? 0,
    });
  }
  return { candles, meta };
}

// Build a quote object from the crumb-free v8 chart endpoint's meta + last candles.
// Yahoo's v7 /quote now requires a crumb/cookie, so this is the reliable path.
export async function yahooQuoteViaChart(symbol) {
  const j = await yahooJson(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`);
  const r = j?.chart?.result?.[0];
  if (!r) return null;
  const m = r.meta || {};
  const closes = (r.indicators?.quote?.[0]?.close || []).filter((x) => x != null);
  const vols = (r.indicators?.quote?.[0]?.volume || []).filter((x) => x != null);
  const price = m.regularMarketPrice ?? closes[closes.length - 1];
  const prev = m.chartPreviousClose ?? m.previousClose ?? (closes.length > 1 ? closes[closes.length - 2] : price);
  if (price == null) return null;
  const change = price - prev;
  return {
    symbol: m.symbol || symbol,
    shortName: m.shortName || m.symbol || symbol,
    longName: m.longName,
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: prev ? (change / prev) * 100 : 0,
    regularMarketPreviousClose: prev,
    regularMarketOpen: m.regularMarketOpen ?? (r.indicators?.quote?.[0]?.open || []).filter((x) => x != null).slice(-1)[0],
    regularMarketDayHigh: m.regularMarketDayHigh,
    regularMarketDayLow: m.regularMarketDayLow,
    regularMarketVolume: m.regularMarketVolume ?? vols[vols.length - 1],
    fiftyTwoWeekHigh: m.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: m.fiftyTwoWeekLow,
    fullExchangeName: m.fullExchangeName || m.exchangeName,
    currency: m.currency || 'USD',
    marketState: m.marketState,
  };
}

export async function yahooQuote(symbols) {
  const list = Array.isArray(symbols) ? symbols : [symbols];
  // First try the batch v7 endpoint (may work in some regions).
  const j = await yahooJson(`/v7/finance/quote?symbols=${encodeURIComponent(list.join(','))}`);
  let results = j?.quoteResponse?.result || [];
  const have = new Set(results.map((r) => r.symbol));
  // Fill any missing via crumb-free chart endpoint (parallel).
  const missing = list.filter((s) => !have.has(s));
  if (missing.length) {
    const filled = await Promise.all(missing.map((s) => yahooQuoteViaChart(s)));
    results = results.concat(filled.filter(Boolean));
  }
  return results.length ? results : null;
}

export async function yahooSearch(q) {
  const j = await yahooJson(`/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`);
  return j?.quotes || null;
}

export async function yahooProfile(symbol) {
  const modules = 'assetProfile,summaryDetail,defaultKeyStatistics,financialData,price';
  const j = await yahooJson(`/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`);
  return j?.quoteSummary?.result?.[0] || null;
}

// ---------- Stooq (CSV, no key) fallback for quotes/history ----------
function stooqSymbol(sym) {
  // Stooq uses lowercase and .us suffix for US equities
  const s = sym.toLowerCase();
  if (s.includes('.') || s.startsWith('^')) return s.replace('^', '^');
  return `${s}.us`;
}

export async function stooqQuote(symbol) {
  const s = stooqSymbol(symbol);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(s)}&f=sd2t2ohlcv&h&e=csv`;
  const res = await tryFetch(url);
  if (!res || !res.ok) return null;
  const text = await res.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  const cols = lines[1].split(',');
  const close = parseFloat(cols[6]);
  const open = parseFloat(cols[3]);
  if (isNaN(close)) return null;
  return {
    symbol,
    regularMarketPrice: close,
    regularMarketOpen: open,
    regularMarketDayHigh: parseFloat(cols[4]),
    regularMarketDayLow: parseFloat(cols[5]),
    regularMarketVolume: parseFloat(cols[7]),
    regularMarketPreviousClose: open,
  };
}

export async function stooqHistory(symbol) {
  const s = stooqSymbol(symbol);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`;
  const res = await tryFetch(url);
  if (!res || !res.ok) return null;
  const text = await res.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  const candles = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, o, h, l, c, v] = lines[i].split(',');
    const close = parseFloat(c);
    if (isNaN(close)) continue;
    candles.push({
      time: Math.floor(new Date(date).getTime() / 1000),
      open: parseFloat(o), high: parseFloat(h), low: parseFloat(l), close, volume: parseFloat(v) || 0,
    });
  }
  return { candles, meta: {} };
}

// ---------- CoinGecko (crypto) ----------
export async function coingeckoMarkets(ids) {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=false`;
  const res = await tryFetch(url);
  if (!res || !res.ok) return null;
  return await res.json().catch(() => null);
}
