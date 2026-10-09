const express = require('express');
const TourController = require('../controllers/tourController');
const { verifyToken, verifyTokenOptional } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected Routes (Cần đăng nhập)
router.get('/wishlist', verifyToken, TourController.getWishlist);
router.post('/:id/favorite', verifyToken, TourController.toggleFavorite);

// Public Routes (Optional Auth - nếu có token thì kiểm tra isFavorite cho user)
router.get('/', verifyTokenOptional, TourController.getAll);
router.get('/:id', verifyTokenOptional, TourController.getDetail);

module.exports = router;
