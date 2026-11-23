const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

const supabase = require('../config/supabase');

const protect = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const { data, error } = await supabase.from('users').select('role,password_version')
      .eq('id', payload.id).maybeSingle();
    if (error) return next(new ApiError(503, 'Could not verify session'));
    if (!data || (payload.passwordVersion ?? 0) !== data.password_version) {
      return next(new ApiError(401, 'Please sign in again'));
    }
    req.user = { ...payload, role: data.role };
    return next();
  } catch (_error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

const allowRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden: insufficient permissions'));
  }
  return next();
};

module.exports = {
  protect,
  allowRoles,
};

