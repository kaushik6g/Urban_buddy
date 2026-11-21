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
