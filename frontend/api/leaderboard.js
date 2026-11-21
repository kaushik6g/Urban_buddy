export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return res.status(401).end();

  const api = 'https://urban-buddy-api.vercel.app/api';
  const key = process.env.URBANBUDDY_SUPABASE_SECRET;
  if (!key) return res.status(503).end();
  try {
    const session = await fetch(api.replace(/\/$/, '') + '/users/profile', {
      headers: { Authorization: authorization }, redirect: 'error', signal: AbortSignal.timeout(10000)
    });
    if (!session.ok) return res.status([401, 403].includes(session.status) ? session.status : 502).end();
    const profile = await session.json();
    if (!profile.success) return res.status(401).end();
    const communityId = profile.data?.user?.communityId;
    if (!communityId) return res.json({ success: true, data: [] });

    const url = new URL('/rest/v1/users', 'https://rvhppsrmkautqvdwiibh.supabase.co');
    url.search = new URLSearchParams({
      select: 'id,name,points,created_at', role: 'eq.user', community_id: 'eq.' + communityId,
      order: 'points.desc,created_at.asc,id.asc', limit: '500'
    }).toString();
    const headers = { apikey: key };
    if (!key.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + key;
    const users = [];
    for (let offset = 0; ; offset += 500) {
      url.searchParams.set('offset', String(offset));
      const result = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      if (!result.ok) return res.status(502).end();
      const page = await result.json();
      users.push(...page);
      if (page.length < 500) break;
    }
    return res.json({ success: true, data: users.map((user, index) => ({
      id: user.id, name: user.name, points: user.points, joinedAt: user.created_at, rank: index + 1
    })) });
  } catch {
    return res.status(502).end();
  }
}
