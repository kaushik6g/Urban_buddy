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

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ community_id: community.id })
    .eq('id', req.user.id);

  if (userUpdateError) {
    return next(new ApiError(500, userUpdateError.message));
  }

  return res.status(200).json({
    success: true,
    message: `Joined community ${community.name}`,
    data: community,
  });
});

const getLeaderboard = asyncHandler(async (_req, res, next) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, points, created_at')
    .eq('role', 'user')
    .order('points', { ascending: false })
    .limit(20);

  if (error) {
    return next(new ApiError(500, error.message));
  }

  return res.status(200).json({
    success: true,
    data: data.map((user, index) => ({
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
