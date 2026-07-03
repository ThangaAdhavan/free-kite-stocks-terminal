import { yahooProfile, yahooQuote, yahooChart } from './_providers.js';

function fmtB(n) {
  if (n == null) return 'n/a';
  const a = Math.abs(n);
  if (a >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toFixed(2);
}

function sma(arr, p) { if (arr.length < p) return null; const s = arr.slice(-p).reduce((a, b) => a + b, 0); return s / p; }
function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  return 100 - 100 / (1 + rs);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const symbol = (req.query.symbol || '').toString();
    if (!symbol) return res.status(400).json({ error: 'symbol required' });

    const [prof, quotes, chart] = await Promise.all([
      yahooProfile(symbol),
      yahooQuote(symbol),
      yahooChart(symbol, '1y', '1d'),
    ]);
    const q = quotes?.[0] || {};
    const ap = prof?.assetProfile || {};
    const sd = prof?.summaryDetail || {};
    const fd = prof?.financialData || {};
    const name = q.longName || q.shortName || symbol;
    const sector = ap.sector || 'its sector';
    const closes = (chart?.candles || []).map((c) => c.close);
    const price = q.regularMarketPrice ?? closes[closes.length - 1];

    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const rsiVal = rsi(closes);
    const pe = q.trailingPE ?? sd.trailingPE?.raw;
    const margin = fd.profitMargins?.raw;
    const revenue = fd.totalRevenue?.raw;
    const growth = fd.revenueGrowth?.raw;
    const beta = sd.beta?.raw;
    const rec = fd.recommendationKey;
    const target = fd.targetMeanPrice?.raw;
    const yr = closes.length ? ((closes[closes.length - 1] / closes[0]) - 1) * 100 : null;

    const trendUp = sma50 && sma200 && sma50 > sma200;
    const overbought = rsiVal != null && rsiVal > 70;
    const oversold = rsiVal != null && rsiVal < 30;

    const summary = `${name} operates in the ${sector} sector${ap.industry ? ` (${ap.industry})` : ''}. ` +
      `The company ${ap.fullTimeEmployees ? `employs approximately ${ap.fullTimeEmployees.toLocaleString()} people and ` : ''}` +
      `has a market capitalization of ${fmtB(q.marketCap)}. ` +
      (ap.longBusinessSummary ? ap.longBusinessSummary.slice(0, 380) + '\u2026' : '');

    const financial = [
      `Revenue (TTM): ${fmtB(revenue)}${growth != null ? ` with ${(growth * 100).toFixed(1)}% YoY growth` : ''}.`,
      pe != null ? `Trailing P/E of ${pe.toFixed(1)}x \u2014 ${pe > 30 ? 'a premium valuation implying high growth expectations' : pe < 15 ? 'a relatively cheap valuation versus the market' : 'in line with broad-market averages'}.` : 'P/E not available.',
      margin != null ? `Net profit margin of ${(margin * 100).toFixed(1)}% signals ${margin > 0.2 ? 'excellent' : margin > 0.1 ? 'healthy' : 'thin'} profitability.` : '',
      fd.totalCash?.raw != null ? `Total cash of ${fmtB(fd.totalCash.raw)} versus total debt of ${fmtB(fd.totalDebt?.raw)}.` : '',
    ].filter(Boolean);

    const swot = {
      strengths: [
        margin > 0.15 ? 'High profit margins support reinvestment and buybacks' : 'Established market presence',
        q.marketCap > 5e10 ? 'Large-cap scale and liquidity' : 'Room to scale within its niche',
        trendUp ? 'Positive long-term price trend (50DMA above 200DMA)' : 'Recognizable brand & customer base',
      ],
      weaknesses: [
        pe > 35 ? 'Elevated valuation leaves little margin for error' : 'Exposure to competitive pricing pressure',
        beta > 1.3 ? 'High beta means above-average volatility' : 'Dependence on macroeconomic cycles',
      ],
      opportunities: [
        `Secular tailwinds within the ${sector} sector`,
        growth > 0.1 ? 'Strong top-line growth momentum' : 'Operational efficiency & margin expansion',
        'International expansion and new product lines',
      ],
      threats: [
        'Rising interest rates and macroeconomic uncertainty',
        'Regulatory scrutiny and competitive disruption',
        overbought ? 'Technically overbought \u2014 near-term pullback risk' : 'Cyclical demand swings',
      ],
    };

    const technical = [
      `Price is ${trendUp ? 'above' : 'below'} its 200-day moving average, indicating a ${trendUp ? 'bullish' : 'bearish/consolidating'} long-term structure.`,
      rsiVal != null ? `14-day RSI is ${rsiVal.toFixed(0)} \u2014 ${overbought ? 'overbought' : oversold ? 'oversold (possible bounce)' : 'neutral'}.` : '',
      sma50 && sma200 ? `50DMA: $${sma50.toFixed(2)} \u00b7 200DMA: $${sma200.toFixed(2)}.` : '',
      yr != null ? `Trailing 12-month price performance: ${yr >= 0 ? '+' : ''}${yr.toFixed(1)}%.` : '',
    ].filter(Boolean);

    const bull = [
      `${growth > 0.1 ? 'Robust revenue growth' : 'Steady cash generation'} underpins the long-term story.`,
      trendUp ? 'Technical momentum is favorable with price above key moving averages.' : 'A reversal above the 200DMA would confirm a new uptrend.',
      target && price ? `Consensus analyst target of $${target.toFixed(2)} implies ${(((target / price) - 1) * 100).toFixed(1)}% upside.` : 'Analyst sentiment leans constructive.',
    ];
    const bear = [
      pe > 30 ? 'A rich valuation could compress if growth decelerates.' : 'Margin pressure could weigh on earnings.',
      overbought ? 'Overbought technicals raise the odds of a near-term drawdown.' : 'A break below support could accelerate selling.',
      beta > 1.2 ? 'High volatility magnifies drawdowns in risk-off markets.' : 'Macro headwinds could dampen demand.',
    ];

    const risk = [
      beta != null ? `Beta of ${beta.toFixed(2)} \u2014 ${beta > 1 ? 'more volatile than' : 'less volatile than'} the broad market.` : 'Volatility profile in line with peers.',
      'Concentration, competitive, and regulatory risks apply to the sector.',
      'Interest-rate sensitivity affects the discount rate on future cash flows.',
    ];

    const thesis = `${name} presents a ${trendUp && growth > 0.08 ? 'compelling growth-at-a-reasonable-price' : trendUp ? 'momentum-driven' : 'contrarian/value'} opportunity. ` +
      `With ${fmtB(q.marketCap)} in market cap, ${pe != null ? `a ${pe.toFixed(0)}x earnings multiple, ` : ''}and ${rec ? `an analyst consensus of "${rec.replace('_', ' ')}", ` : ''}` +
      `the risk/reward appears ${trendUp && !overbought ? 'favorable for accumulation on dips' : overbought ? 'stretched near current levels \u2014 patience advised' : 'balanced, warranting a watchful stance'}. ` +
      `Investors should size positions according to the ${beta > 1.2 ? 'elevated' : 'moderate'} volatility profile.`;

    return res.status(200).json({
      symbol, name, generatedAt: Date.now(),
      summary, financial, swot, technical,
      bullCase: bull, bearCase: bear, risk, thesis,
      metrics: { price, sma50, sma200, rsi: rsiVal, pe, beta, target, yearReturn: yr, recommendation: rec },
    });
  } catch (err) {
    console.error('ai-research error', err);
    return res.status(500).json({ error: err.message });
  }
}
