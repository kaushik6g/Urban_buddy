const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const getProfile = asyncHandler(async (req, res, next) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email, role, points, created_at, community_id, communities!users_community_id_fkey(id, name, code)')
    .eq('id', req.user.id)
    .single();

  if (userError) {
    return next(new ApiError(500, userError.message));
  }

  const { data: activity, error: activityError } = await supabase
    .from('complaints')
    .select('id, title, status, admin_note, progress_note, created_at')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (activityError) {
    return next(new ApiError(500, activityError.message));
  }

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        communityId: user.community_id || null,
        community: user.communities
          ? {
              id: user.communities.id,
              name: user.communities.name,
              code: user.communities.code,
            }
          : null,
        createdAt: user.created_at,
      },
      activity: activity.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        rejectNote: item.admin_note || '',
        progressNote: item.progress_note || '',
        createdAt: item.created_at,
      })),
    },
  });
});

const joinCommunity = asyncHandler(async (req, res, next) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  if (!code) {
    return next(new ApiError(400, 'Community code is required'));
  }

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id, name, code')
    .eq('code', code)
    .maybeSingle();

  if (communityError) {
    return next(new ApiError(500, communityError.message));
  }

  if (!community) {
    return next(new ApiError(404, 'Invalid community code'));
  }

  const { data: outcome, error: switchError } = await supabase.rpc('switch_community', {
    member_id: req.user.id,
    target_id: community.id,
    confirmed: req.body.confirmChange === true,
  });
  if (switchError) return next(new ApiError(500, switchError.message));
  if (outcome === 'forbidden') return next(new ApiError(403, 'Only regular users can change communities'));
  if (outcome === 'confirmation_required') {
    return next(new ApiError(409, 'Confirm deletion of your previous complaints to change communities'));
  }

  return res.status(200).json({
    success: true,
    message: `Joined community ${community.name}`,
    data: community,
  });
});

const getLeaderboard = asyncHandler(async (req, res, next) => {
  const { data: viewer, error: viewerError } = await supabase
    .from('users').select('community_id').eq('id', req.user.id).single();
  if (viewerError) return next(new ApiError(500, viewerError.message));
  if (!viewer.community_id) return res.json({ success: true, data: [] });

  const members = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
    .from('users')
    .select('id, name, points, created_at')
      .eq('role', 'user')
      .eq('community_id', viewer.community_id)
      .order('points', { ascending: false })
      .order('id')
      .range(offset, offset + pageSize - 1);

    if (error) return next(new ApiError(500, error.message));
    members.push(...data);
    if (data.length < pageSize) break;
  }

  return res.status(200).json({
    success: true,
    data: members.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      points: user.points,
      joinedAt: user.created_at,
    })),
  });
});

module.exports = {
  getProfile,
  getLeaderboard,
  joinCommunity,
};
