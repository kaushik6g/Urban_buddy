const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/invite-details', require('../utils/asyncHandler')(async (req,res) => {
  const digest = require('node:crypto').createHash('sha256').update(String(req.body?.token || '')).digest('hex');
  const result = await require('../config/supabase').from('community_invites').select('email,communities(code)').eq('digest',digest).gt('expires_at',new Date().toISOString()).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return res.status(410).json({message:'This invitation has expired, was revoked, or was already used.'});
  res.set('Cache-Control','no-store').json({email:result.data.email,code:result.data.communities.code});
}));
router.post('/invitation', require('../utils/asyncHandler')(async (req, res) => {
  const token = req.body?.accessToken;
  if (typeof token !== 'string' || !token) return res.sendStatus(400);
  const { data, error } = await require('../config/supabase').auth.getUser(token);
  if (error || !data.user?.invited_at || !data.user.user_metadata?.communityCode) return res.sendStatus(401);
  res.set('Cache-Control', 'no-store').json({ email: data.user.email, code: data.user.user_metadata.communityCode });
}));

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
    body('communityName')
      .optional()
      .isLength({ min: 3, max: 80 })
      .withMessage('Community name must be between 3 and 80 characters'),
    body('communityCode')
      .optional()
      .isLength({ min: 4, max: 12 })
      .withMessage('Community code must be 4 to 12 characters'),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

const { generateCodes, changePassword, issueMemberCode, resetPassword } = require('../controllers/passwordRecovery');
const { protect, allowRoles } = require('../middleware/auth');
const currentPassword = body('currentPassword').isString().bail().notEmpty();
const newPassword = body('password').isString().bail().isLength({min:6})
  .custom(value => Buffer.byteLength(value) <= 72).withMessage('Use at least 6 characters and at most 72 bytes.');
router.post('/backup-codes', protect, currentPassword, validate, generateCodes);
router.post('/change-password', protect, currentPassword, newPassword, validate, changePassword);
router.post('/member-reset-code', protect, allowRoles('admin'), currentPassword, body('memberId').isUUID(), validate, issueMemberCode);
router.post('/reset-password', body('email').isString().bail().trim().isEmail(),
  body('code').isString().bail().isLength({min:1,max:100}), newPassword, validate, resetPassword);
module.exports = router;
