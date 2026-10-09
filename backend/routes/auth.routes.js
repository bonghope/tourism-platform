const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// 1. Đăng ký tài khoản (Luồng 2 bước OTP 5 phút)
router.post('/register', authController.register);
router.post('/verify-register-otp', authController.verifyRegisterOtp);

// 2. Đăng nhập
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin); // Đăng nhập Google với mật khẩu & OTP
router.post('/google-otp', authController.requestGoogleOtp); // Gửi OTP đến Gmail

// 3. Quên mật khẩu (Luồng 2 bước an toàn)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// 4. Đổi mật khẩu (Yêu cầu Token)
router.put('/change-password', verifyToken, authController.changePassword);

// 5. Quản trị viên (Danh sách & Cấp token nhanh cho Admin Portal)
router.get('/admin-list', authController.getAdminList);
router.post('/admin-token', authController.getAdminToken);

module.exports = router;