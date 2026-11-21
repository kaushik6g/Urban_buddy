const express = require('express');
const { body } = require('express-validator');
const { getProfile, getLeaderboard, joinCommunity } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/leaderboard', protect, getLeaderboard);
router.post(
	'/join-community',
	protect,
	[body('code').trim().notEmpty().withMessage('Community code is required'), validate],
	joinCommunity
);

module.exports = router;
