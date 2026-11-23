const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const digest = token => crypto.createHash('sha256').update(token).digest('hex');
const requestReset = asyncHandler(async (req, res) => {
  const { RESEND_API_KEY, PASSWORD_RESET_FROM, PASSWORD_RESET_ORIGIN } = process.env;
  if (!RESEND_API_KEY || !PASSWORD_RESET_FROM || !PASSWORD_RESET_ORIGIN) {
    throw new ApiError(503, 'Password recovery is temporarily unavailable.');
  }
  const link = new URL('/reset-password', PASSWORD_RESET_ORIGIN);
  if (link.protocol !== 'https:' && link.hostname !== 'localhost') {
    throw new ApiError(503, 'Password recovery is temporarily unavailable.');
  }
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expires = new Date(now + 15 * 60000).toISOString();
  // A conditional write allows one email per address per minute across instances.
  const retryBefore = new Date(now + 14 * 60000).toISOString();
  const { data, error } = await supabase.from('users')
    .update({ password_reset_digest: digest(token), password_reset_expires_at: expires })
    .eq('email', req.body.email.trim().toLowerCase())
    .or('password_reset_expires_at.is.null,password_reset_expires_at.lt.' + retryBefore)
    .select('email').maybeSingle();
  if (error) throw new ApiError(503, 'Password recovery is temporarily unavailable.');
  if (data) {
    link.hash = 'token=' + token;
    try {
      const result = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: PASSWORD_RESET_FROM, to: [data.email],
          subject: 'Reset your UrbanBuddy password',
          text: 'Use this link within 15 minutes to choose a new password:\n' + link.href +
            '\nIf you did not request this change, you can ignore this email.' })
      });
      if (!result.ok) throw new Error('Delivery failed');
    } catch {
      console.error('UrbanBuddy password recovery email delivery failed');
    }
  }
  res.set('Cache-Control', 'no-store').json({ success: true });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const invalid = () => new ApiError(400, 'This link has expired or was already used. Request a new link.');
  const hash = digest(token);
  const { data: user, error } = await supabase.from('users').select('id,password_version')
    .eq('password_reset_digest', hash).gt('password_reset_expires_at', new Date().toISOString()).maybeSingle();
  if (error) throw new ApiError(503, 'Password recovery is temporarily unavailable.');
  if (!user) throw invalid();
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await supabase.from('users').update({ password: passwordHash, password_reset_digest: null,
    password_reset_expires_at: null, password_version: user.password_version + 1 })
    .eq('id', user.id).eq('password_reset_digest', hash)
    .gt('password_reset_expires_at', new Date().toISOString()).select('id').maybeSingle();
  if (result.error) throw new ApiError(503, 'Password recovery is temporarily unavailable.');
  if (!result.data) throw invalid();
  res.set('Cache-Control', 'no-store').json({ success: true });
});

module.exports = { requestReset, resetPassword };
