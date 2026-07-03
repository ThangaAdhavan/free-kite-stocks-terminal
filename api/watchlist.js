import supabase from './db-client.js';

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { symbol, name, type, sector } = req.body;
      if (!symbol) return res.status(400).json({ error: 'symbol required' });
      const { data: existing } = await supabase
        .from('watchlist').select('id').eq('user_id', user.id).eq('symbol', symbol).maybeSingle();
      if (existing) return res.status(200).json(existing);
      const { data, error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, symbol, name: name || symbol, type: type || 'EQUITY', sector: sector || null })
        .select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { symbol } = req.body;
      const { error } = await supabase
        .from('watchlist').delete().eq('user_id', user.id).eq('symbol', symbol);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('watchlist error', err);
    return res.status(500).json({ error: err.message });
  }
}
