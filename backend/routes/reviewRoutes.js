const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Khách hàng gửi đánh giá
router.post('/', reviewController.createReview);

// Xem danh sách đánh giá của 1 Tour (Ví dụ: /api/reviews/tour/T05)
router.get('/tour/:tourId', reviewController.getTourReviews);

module.exports = router;