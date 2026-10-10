const express = require('express');
const DestinationController = require('../controllers/destinationController');
const { verifyToken, verifyTokenOptional } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected Routes (Cần đăng nhập)
router.get('/wishlist', verifyToken, DestinationController.getWishlist);
router.post('/:id/favorite', verifyToken, DestinationController.toggleFavorite);

// Public Routes (Optional Auth - nếu có token thì cá nhân hóa gợi ý và kiểm tra isFavorite)
router.get('/', DestinationController.getAll);
router.get('/recommendations', verifyTokenOptional, DestinationController.getRecommendations);
router.get('/search', DestinationController.search);
router.get('/:id', DestinationController.getDetail);
router.get('/:id/tours', verifyTokenOptional, DestinationController.getTours);

module.exports = router;
