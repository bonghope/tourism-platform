const express = require('express');
const DestinationController = require('../controllers/destinationController');

// Helper mock auth (tương thích trước khi tích hợp module auth chính thức)
const mockAuth = (req, res, next) => {
    req.user = { userId: '11111111-1111-1111-1111-111111111111', role: 'USER' };
    next();
};

const optionalMockAuth = (req, res, next) => {
    const mockUserId = req.headers['x-mock-user-id'];
    req.user = mockUserId ? { userId: mockUserId, role: 'USER' } : null;
    next();
};

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
