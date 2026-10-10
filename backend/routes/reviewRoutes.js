const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const reviewController = require('../controllers/reviewController');

// Khách hàng gửi đánh giá
router.post('/', verifyToken, reviewController.createReview);

// Xem danh sách đánh giá của 1 Tour (Ví dụ: /api/reviews/tour/T05)
router.get('/tour/:tourId', reviewController.getTourReviews);

module.exports = router;