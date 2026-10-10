const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Các API này bị chặn bởi verifyToken, phải có Token mới lọt qua được
router.post('/logout', verifyToken, authController.logout);

// 1. Profile
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.post('/request-email-otp', verifyToken, userController.requestEmailOtp);
router.post('/verify-email-otp', verifyToken, userController.verifyEmailOtp);
router.post('/request-phone-otp', verifyToken, userController.requestPhoneOtp);
router.post('/verify-phone-otp', verifyToken, userController.verifyPhoneOtp);

// 2. Wishlist Tours
router.get('/wishlist', verifyToken, userController.getWishlist);
router.post('/wishlist', verifyToken, userController.toggleWishlist);

// 3. Favorite Destinations
router.get('/favorite-destinations', verifyToken, userController.getFavoriteDestinations);
router.post('/favorite-destinations', verifyToken, userController.toggleFavoriteDestination);

module.exports = router;