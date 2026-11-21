export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return res.status(401).end();

  const api = process.env.VITE_API_URL;
  const key = process.env.URBANBUDDY_SUPABASE_SECRET;
  if (!api || !key) return res.status(503).end();
  try {
    const session = await fetch(api.replace(/\/$/, '') + '/users/profile', {
      headers: { Authorization: authorization }, redirect: 'error', signal: AbortSignal.timeout(10000)
    });
    if (!session.ok) return res.status([401, 403].includes(session.status) ? session.status : 502).end();
    const profile = await session.json();
    if (!profile.success) return res.status(401).end();
    const url = new URL('/rest/v1/users', 'https://rvhppsrmkautqvdwiibh.supabase.co');
    url.search = new URLSearchParams({
      select: 'id,name,points,created_at', role: 'eq.user',
      order: 'points.desc,created_at.asc,id.asc', limit: '20'
    }).toString();
    const headers = { apikey: key };
    if (!key.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + key;
    const result = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!result.ok) return res.status(502).end();
    const users = await result.json();
    return res.json({ success: true, data: users.map((user, index) => ({
      id: user.id, name: user.name, points: user.points, joinedAt: user.created_at, rank: index + 1
    })) });
  } catch {
    return res.status(502).end();
  }
}
