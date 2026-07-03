import { coingeckoMarkets } from './_providers.js';

const IDS = ['bitcoin','ethereum','solana','binancecoin','ripple','cardano','dogecoin','avalanche-2','chainlink','polkadot','tron','matic-network'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const data = await coingeckoMarkets(IDS);
    if (!data) return res.status(200).json([]);
    const out = data.map((c) => ({
      symbol: c.symbol.toUpperCase() + '-USD',
      name: c.name,
      image: c.image,
      price: c.current_price,
      change: c.price_change_24h,
      changePercent: c.price_change_percentage_24h,
      marketCap: c.market_cap,
      volume: c.total_volume,
      high24h: c.high_24h,
      low24h: c.low_24h,
    }));
    return res.status(200).json(out);
  } catch (err) {
    console.error('crypto error', err);
    return res.status(500).json({ error: err.message });
  }
}
