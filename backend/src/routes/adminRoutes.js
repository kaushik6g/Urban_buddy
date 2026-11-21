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
  if (!result.data) return res.status(409).json({message:'No eligible member found'});
  return res.status(204).end();
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
    body('status').isIn(['Approved', 'In Progress', 'Resolved']).withMessage('Invalid status'),
    body('progressNote').isString().bail().trim().notEmpty().withMessage('A status comment is required').bail().isLength({ max: 500 }).withMessage('Progress note too long'),
    validate,
  ],
  updateComplaintStatus
);

module.exports = router;
