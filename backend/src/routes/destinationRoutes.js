const express = require('express');
const DestinationController = require('../controllers/destinationController');
const mockAuth = require('../middlewares/mockAuthMiddleware');
const optionalMockAuth = require('../middlewares/optionalMockAuth');

const router = express.Router();

// Protected Routes (Cần đăng nhập)
router.get('/wishlist', mockAuth, DestinationController.getWishlist);
router.get('/recommendations', mockAuth, DestinationController.getRecommendations);

// Public Routes (Optional Auth)
router.get('/search', DestinationController.search);
router.get('/:id', DestinationController.getDetail);
router.get('/:id/tours', optionalMockAuth, DestinationController.getTours);

// Protected Routes (Cần đăng nhập)
router.post('/:id/favorite', mockAuth, DestinationController.toggleFavorite);

module.exports = router;
