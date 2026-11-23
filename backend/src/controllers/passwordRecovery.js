const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/supabase');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

function digest(code) {
  return crypto.createHmac('sha256', env.jwtSecret).update('urbanbuddy-recovery:' + code).digest('hex');
}
function code(prefix, bytes) {
  return prefix + '-' + crypto.randomBytes(bytes).toString('hex').toUpperCase().match(/.{4}/g).join('-');
}
function reply(res, values) {
  return res.set('Cache-Control', 'no-store').json(values);
}
async function confirmPassword(req) {
  const { data, error } = await db.from('users').select('id,password,password_version,role,community_id')
    .eq('id', req.user.id).single();
  if (error) throw error;
  if (data.password_version !== (req.user.passwordVersion ?? 0) || !await bcrypt.compare(req.body.currentPassword, data.password)) {
    throw new ApiError(403, 'Check your current password and try again.');
  }
  return data;
}
async function save(user, changes) {
  let query = db.from('users').update(changes)
    .eq('id', user.id).eq('password_version', user.password_version)
    .eq('role', user.role);
  query = user.community_id ? query.eq('community_id', user.community_id) : query.is('community_id', null);
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(409, 'Your account changed. Sign in and try again.');
}
const generateCodes = asyncHandler(async (req,res) => {
  const user = await confirmPassword(req);
  const codes = Array.from({ length: 5 }, () => code('B',16));
  await save(user, { backup_code_hashes: codes.map(digest),
    recovery_community: user.role === 'user' ? user.community_id : null,
    password_reset_digest: null, password_reset_expires_at: null, recovery_attempts: 0 });
  reply(res,{ codes });
});
const changePassword = asyncHandler(async (req,res) => {
  const user = await confirmPassword(req);
  await save(user, { password: await bcrypt.hash(req.body.password,10), password_version: user.password_version+1,
    password_reset_digest:null, password_reset_expires_at:null });
  reply(res,{success:true});
});
const issueMemberCode = asyncHandler(async (req,res) => {
  const admin = await confirmPassword(req);
  const temporary = code('T',6);
  const { data,error } = await db.rpc('issue_member_recovery', { p_admin:admin.id, p_member:req.body.memberId,
    p_digest:digest(temporary), p_version:admin.password_version });
  if (error) throw error;
  if (!data) throw new ApiError(403,'This member has not enabled recovery with your community.');
  reply(res,{code:temporary});
});
const resetPassword = asyncHandler(async (req,res) => {
  const input = req.body.code.trim().toUpperCase().replace(/[\s-]/g,'');
  const temporary = input.startsWith('T');
  const invalid = () => new ApiError(400,'The email or code is incorrect, expired, or already used.');
  if (!/^(B[0-9A-F]{32}|T[0-9A-F]{12})$/.test(input)) throw invalid();
  const canonical = input[0] + '-' + input.slice(1).match(/.{4}/g).join('-');
  const { data,error } = await db.rpc('consume_account_code', { p_email:req.body.email.trim().toLowerCase(),
    p_digest:digest(canonical), p_temporary:temporary, p_password:await bcrypt.hash(req.body.password,10) });
  if (error) throw error;
  if (!data) throw invalid();
  reply(res,{success:true});
});
module.exports = { generateCodes, changePassword, issueMemberCode, resetPassword };
