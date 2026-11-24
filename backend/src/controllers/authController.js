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

const { createHmac, randomUUID } = require('node:crypto');

function limited(res, seconds) {
  return res.set('Retry-After', String(seconds)).set('Cache-Control', 'no-store').status(429).json({
    success: false, message: `Too many sign-in attempts. Try again in ${seconds} seconds.`,
  });
}

const login = asyncHandler(async (req, res, next) => {
  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;
  const account = createHmac('sha256', env.jwtSecret).update('login-limit:' + email).digest('hex');
  const ticket = randomUUID();
  const { data: attempt, error: limitError } = await supabase.rpc('reserve_login_attempt', {
    p_account: account, p_ticket: ticket,
  }).single();
  if (limitError || !attempt) throw new ApiError(503, 'Sign-in is temporarily unavailable.');
  if (attempt.wait_seconds > 0) return limited(res, attempt.wait_seconds);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, points, created_at, password, password_version, community_id, communities!users_community_id_fkey(id, name, code)')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new ApiError(503, 'Sign-in is temporarily unavailable.');
  if (!user || !await bcrypt.compare(password, user.password)) {
    if (attempt.failure_delay > 0) return limited(res, attempt.failure_delay);
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // Only the latest reservation may reset the counter. Keep newer attempts intact.
  const { error: clearError } = await supabase.from('login_attempt_limits').update({ attempts: 0, blocked_until: '1970-01-01T00:00:00Z' })
    .eq('account_key', account).eq('last_ticket', ticket);
  if (clearError) throw new ApiError(503, 'Sign-in is temporarily unavailable.');
  return res.status(200).json({
    success: true, message: 'Login successful', token: signToken(user), user: sanitizeUser(user),
  });
});

module.exports = { register, login };
