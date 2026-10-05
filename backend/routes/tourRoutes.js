const express = require('express');
const TourController = require('../controllers/tourController');

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
router.get('/wishlist', mockAuth, TourController.getWishlist);

// Public Routes (Optional Auth)
router.get('/', optionalMockAuth, TourController.getAll);
router.get('/:id', optionalMockAuth, TourController.getDetail);

// Protected Routes (Cần đăng nhập)
router.post('/:id/favorite', mockAuth, TourController.toggleFavorite);

module.exports = router;
