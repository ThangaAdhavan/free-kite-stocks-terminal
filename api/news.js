const UA = { 'User-Agent': 'Mozilla/5.0' };

function stripTags(s) { return (s || '').replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim(); }

function sentiment(text) {
  const t = (text || '').toLowerCase();
  const pos = ['surge','gain','rise','beat','record','growth','rally','soar','jump','profit','strong','upgrade','bullish','outperform'];
  const neg = ['fall','drop','loss','miss','decline','plunge','cut','slump','weak','downgrade','bearish','fraud','lawsuit','recall'];
  let score = 0;
  for (const w of pos) if (t.includes(w)) score++;
  for (const w of neg) if (t.includes(w)) score--;
  return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const symbol = (req.query.symbol || '').toString();
    if (symbol) {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=20`;
      const r = await fetch(url, { headers: UA });
      if (r.ok) {
        const j = await r.json();
        const news = (j.news || []).map((n) => ({
          title: n.title,
          publisher: n.publisher,
          link: n.link,
          published: n.providerPublishTime ? n.providerPublishTime * 1000 : Date.now(),
          image: n.thumbnail?.resolutions?.[0]?.url || null,
          sentiment: sentiment(n.title),
          related: (n.relatedTickers || []).slice(0, 4),
        }));
        if (news.length) return res.status(200).json(news);
      }
    }

    const rss = 'https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US&s=^GSPC,AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL,META,BTC-USD';
    const rr = await fetch(rss, { headers: UA });
    const xml = await rr.text();
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = regex.exec(xml)) && items.length < 24) {
      const block = m[1];
      const title = stripTags((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
      const link = stripTags((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
      const pub = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
      const desc = stripTags((block.match(/<description>([\s\S]*?)<\/description>/) || [])[1]);
      if (!title) continue;
      items.push({
        title,
        publisher: 'Yahoo Finance',
        link,
        published: pub ? new Date(pub).getTime() : Date.now(),
        image: null,
        summary: desc.slice(0, 200),
        sentiment: sentiment(title + ' ' + desc),
        related: [],
      });
    }
    return res.status(200).json(items);
  } catch (err) {
    console.error('news error', err);
    return res.status(500).json({ error: err.message });
  }
}
