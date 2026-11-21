const express = require('express');
const { body } = require('express-validator');
const {
  createComplaint,
  getPublicComplaints,
  getMyComplaints,
  getDeletedComplaints,
  deleteComplaint,
} = require('../controllers/complaintController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'images', maxCount: 8 },
    { name: 'image', maxCount: 1 },
  ]),
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('description')
      .trim()
      .isLength({ min: 15 })
      .withMessage('Description must be at least 15 characters'),
    body('category').isIn(['Pothole', 'Garbage', 'Streetlight', 'Water Leakage', 'Road Damage', 'Other'])
      .withMessage('Invalid category'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    validate,
  ],
  createComplaint
);

router.get('/', getPublicComplaints);
router.get('/my', protect, getMyComplaints);

router.get('/deleted', protect, getDeletedComplaints);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
