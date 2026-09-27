const express = require('express');
const TourController = require('../controllers/tourController');
const mockAuth = require('../middlewares/mockAuthMiddleware');

const optionalMockAuth = require('../middlewares/optionalMockAuth');

const router = express.Router();

// Protected Routes (Cần đăng nhập)
router.get('/wishlist', mockAuth, TourController.getWishlist);

// Public Routes (Optional Auth)
router.get('/', optionalMockAuth, TourController.getAll);
router.get('/:id', optionalMockAuth, TourController.getDetail);

// Protected Routes (Cần đăng nhập)
router.post('/:id/favorite', mockAuth, TourController.toggleFavorite);

module.exports = router;
