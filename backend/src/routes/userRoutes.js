const express = require('express');
const { body } = require('express-validator');
const { getProfile, getLeaderboard, joinCommunity } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/updates', protect, require('../utils/asyncHandler')(async (req, res) => {
  const { data, error } = await require('../config/supabase').from('complaint_updates')
    .select('id,title,status,note,points_change,created_at').eq('user_id', req.user.id).order('id', { ascending: false });
  if (error) throw error;
  res.json({ data });
}));
router.get('/profile', protect, getProfile);
router.get('/leaderboard', protect, getLeaderboard);
router.post(
	'/join-community',
	protect,
	[body('code').trim().notEmpty().withMessage('Community code is required'), validate],
	joinCommunity
);

module.exports = router;
