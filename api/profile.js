import { yahooProfile, yahooQuote, yahooQuoteViaChart } from './_providers.js';
import { SYMBOLS } from './_symbols.js';

const NAME_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.symbol.toUpperCase(), s.name]));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const symbol = (req.query.symbol || '').toString();
    if (!symbol) return res.status(400).json({ error: 'symbol required' });

    const [profile, quotes, chartQuote] = await Promise.all([
      yahooProfile(symbol).catch(() => null),
      yahooQuote(symbol).catch(() => null),
      yahooQuoteViaChart(symbol).catch(() => null),
    ]);

    const q = quotes?.[0] || chartQuote || {};
    const ap = profile?.assetProfile || {};
    const sd = profile?.summaryDetail || {};
    const ks = profile?.defaultKeyStatistics || {};
    const fd = profile?.financialData || {};
    const price = profile?.price || {};

    const officers = ap.companyOfficers || [];
    const ceo = officers.find((o) => /chief executive|ceo/i.test(o.title || ''))?.name || officers[0]?.name || null;

    const website = ap.website || null;
    const domain = website ? website.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0] : null;

    const name = q.longName || q.shortName || price.longName?.raw || NAME_MAP[symbol.toUpperCase()] || symbol;

    const out = {
      symbol,
      name,
      logo: domain ? `https://logo.clearbit.com/${domain}` : null,
      sector: ap.sector || null,
      industry: ap.industry || null,
      description: ap.longBusinessSummary || null,
      ceo,
      employees: ap.fullTimeEmployees || null,
      headquarters: [ap.city, ap.state, ap.country].filter(Boolean).join(', ') || null,
      website,
      phone: ap.phone || null,
      price: q.regularMarketPrice ?? price.regularMarketPrice?.raw,
      change: q.regularMarketChange ?? price.regularMarketChange?.raw,
      changePercent: q.regularMarketChangePercent ?? price.regularMarketChangePercent?.raw,
      previousClose: q.regularMarketPreviousClose ?? sd.previousClose?.raw,
      open: q.regularMarketOpen ?? sd.open?.raw,
      dayHigh: q.regularMarketDayHigh ?? sd.dayHigh?.raw,
      dayLow: q.regularMarketDayLow ?? sd.dayLow?.raw,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? sd.fiftyTwoWeekHigh?.raw,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? sd.fiftyTwoWeekLow?.raw,
      volume: q.regularMarketVolume ?? sd.volume?.raw,
      avgVolume: q.averageDailyVolume3Month ?? sd.averageVolume?.raw,
      marketCap: q.marketCap ?? sd.marketCap?.raw,
      pe: q.trailingPE ?? sd.trailingPE?.raw,
      forwardPe: q.forwardPE ?? sd.forwardPE?.raw,
      eps: q.epsTrailingTwelveMonths ?? ks.trailingEps?.raw,
      beta: sd.beta?.raw ?? ks.beta?.raw,
      dividendYield: sd.dividendYield?.raw,
      profitMargin: fd.profitMargins?.raw,
      revenue: fd.totalRevenue?.raw,
      grossMargin: fd.grossMargins?.raw,
      recommendation: fd.recommendationKey,
      targetMean: fd.targetMeanPrice?.raw,
      currency: q.currency || price.currency || 'USD',
      exchange: q.fullExchangeName || price.exchangeName,
      marketState: q.marketState || price.marketState,
    };

    return res.status(200).json(out);
  } catch (err) {
    console.error('profile error', err);
    return res.status(500).json({ error: err.message });
  }
}
