const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { generateUniqueCommunityCode } = require('../utils/community');

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      passwordVersion: user.password_version ?? 0,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const sanitizeUser = (user) => ({
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
});

/* ================= REGISTER ================= */

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'user', communityName, communityCode } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return next(new ApiError(400, 'Role must be either user or admin'));
  }

  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (lookupError) {
    return next(new ApiError(500, lookupError.message));
  }

  if (existing) {
    return next(new ApiError(409, 'Email already registered'));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (req.body.inviteToken) {
    if (role !== 'user') return next(new ApiError(400, 'Invitations are for citizen accounts only'));
    const digest = require('node:crypto').createHash('sha256').update(String(req.body.inviteToken)).digest('hex');
    const result = await supabase.rpc('redeem_community_invite', {p_digest:digest,p_name:name,p_email:email,p_bcrypt_hash:hashedPassword});
    if (result.error) throw result.error;
    if (!result.data) return next(new ApiError(410,'Invitation is unavailable. Ask your admin for a new link.'));
    return res.status(201).json({success:true});
  }

  let joinedCommunityId = null;

  if (role === 'user') {
    if (typeof communityCode !== 'string' || !communityCode.trim()) {
      return next(new ApiError(400, 'Community code is required'));
    }
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('code', communityCode.trim().toUpperCase())
      .maybeSingle();

    if (communityError) {
      return next(new ApiError(500, communityError.message));
    }

    if (!community) {
      return next(new ApiError(404, 'Community code is invalid'));
    }

    joinedCommunityId = community.id;
  }

  const { data: insertedUser, error } = await supabase
    .from('users')
    .insert({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      community_id: joinedCommunityId,
    })
    .select('id, name, email, role, points, created_at, community_id')
    .single();

  if (error) {
    return next(new ApiError(500, error.message));
  }

  if (role === 'admin') {
    const code = communityCode?.trim().toUpperCase() || await generateUniqueCommunityCode();

    const { data: newCommunity, error: communityCreateError } = await supabase
      .from('communities')
      .insert({
        name: communityName?.trim() || `${name}'s Community`,
        code,
        created_by: insertedUser.id,
      })
      .select('id')
      .single();

    if (communityCreateError) {
      await supabase.from('users').delete().eq('id', insertedUser.id).is('community_id', null);
      return next(new ApiError(communityCreateError.code === '23505' ? 409 : 500, 'Could not create community. Choose another invite code.'));
    }

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ community_id: newCommunity.id })
      .eq('id', insertedUser.id);

    if (userUpdateError) {
      return next(new ApiError(500, userUpdateError.message));
    }
  }

  const { data, error: userFetchError } = await supabase
    .from('users')
    .select('id, name, email, role, points, created_at, community_id, communities!users_community_id_fkey(id, name, code)')
    .eq('id', insertedUser.id)
    .single();

  if (userFetchError) {
    return next(new ApiError(500, userFetchError.message));
  }

  const token = signToken(data);

  return res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: sanitizeUser(data),
  });
});

/* ================= LOGIN (FIXED) ================= */

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, points, created_at, password, password_version, community_id, communities!users_community_id_fkey(id, name, code)')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("SUPABASE ERROR:", error);
    return next(new ApiError(500, error.message));
  }

  if (!user) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // 🔥 CRITICAL FIX
  if (!user.password) {
    console.error("Password missing in DB!");
    return next(new ApiError(500, 'Password not found in database'));
  }

  let isMatch = false;

  try {
    isMatch = await bcrypt.compare(password, user.password);
  } catch (err) {
    console.error("BCRYPT ERROR:", err);
    return next(new ApiError(500, 'Error comparing passwords'));
  }

  if (!isMatch) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  const token = signToken(user);

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: sanitizeUser(user),
  });
});

module.exports = {
  register,
  login,
};

