const express = require('express');
const { body } = require('express-validator');
const {
  getAllComplaints,
  approveComplaint,
  rejectComplaint,
  updateComplaintStatus,
  getMyCommunity,
} = require('../controllers/adminController');
const { protect, allowRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, allowRoles('admin'));

router.post('/members', require('../utils/asyncHandler')(async (req, res) => {
  const db = require('../config/supabase');
  const { data: admin, error } = await db.from('users').select('community_id').eq('id', req.user.id).eq('role','admin').single();
  if (error || !admin?.community_id) return res.status(403).json({ message: 'Community administrator required' });
  const adding = req.body.action === 'add';
  if (!adding && req.body.action !== 'remove') return res.status(400).json({message:'Invalid action'});
  let query = db.from('users').update({community_id: adding ? admin.community_id : null}).eq('role','user');
  query = adding ? query.eq('email', String(req.body.email || '').trim().toLowerCase()).is('community_id',null)
    : query.eq('id',req.body.id).eq('community_id',admin.community_id);
  const result = await query.select('id').maybeSingle();
  if (result.error) throw result.error;
  if (adding && !result.data) {
    const email = String(req.body.email || '').trim().toLowerCase();
    const existing = await db.from('users').select('id').eq('email', email).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({message:'Enter a valid email.'});
      const crypto = require('node:crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const digest = crypto.createHash('sha256').update(token).digest('hex');
      const expires_at = new Date(Date.now() + 7 * 86400000).toISOString();
      const saved = await db.from('community_invites').upsert({community_id: admin.community_id, email, digest, expires_at}, {onConflict:'community_id,email'});
      if (saved.error) throw saved.error;
      return res.set('Cache-Control','no-store').status(201).json({token, email});
    }
  }
  if (!result.data) return res.status(409).json({message:'No eligible member found'});
  return res.status(204).end();
}));
router.get('/invitations', require('../utils/asyncHandler')(async (req, res) => {
  const db = require('../config/supabase');
  const admin = await db.from('users').select('community_id').eq('id', req.user.id).single();
  if (admin.error) throw admin.error;
  if (!admin.data.community_id) return res.status(403).json({message:'Community administrator required'});
  const invites = await db.from('community_invites').select('email,expires_at')
    .eq('community_id', admin.data.community_id).gt('expires_at', new Date().toISOString())
    .order('expires_at', {ascending:false});
  if (invites.error) throw invites.error;
  res.set('Cache-Control','no-store').json(invites.data);
}));
router.delete('/invitations', require('../utils/asyncHandler')(async (req,res) => {
  const db = require('../config/supabase');
  const admin = await db.from('users').select('community_id').eq('id',req.user.id).single();
  if (admin.error) throw admin.error;
  const result = await db.from('community_invites').delete().eq('community_id',admin.data.community_id).eq('email',String(req.body.email).trim().toLowerCase());
  if (result.error) throw result.error;
  res.sendStatus(204);
}));
router.get('/complaints', getAllComplaints);
router.get('/community', getMyCommunity);
router.post('/community-code', (_req, res) => res.status(409).json({ message: 'Community codes are permanent.' }));
router.put('/complaints/:id/approve', approveComplaint);
router.put(
  '/complaints/:id/reject',
  [
    body('note').trim().notEmpty().withMessage('Reject note is required'),
    body('note').isLength({ max: 500 }).withMessage('Note too long'),
    validate,
  ],
  rejectComplaint
);
router.put(
  '/complaints/:id/status',
  [
    body('status').isIn(['Approved', 'In Progress', 'Resolved', 'Rejected']).withMessage('Invalid status'),
    body('progressNote').isString().bail().trim().notEmpty().withMessage('A status comment is required').bail().isLength({ max: 500 }).withMessage('Progress note too long'),
    validate,
  ],
  updateComplaintStatus
);

module.exports = router;
