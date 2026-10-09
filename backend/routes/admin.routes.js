const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.use(verifyToken, isAdmin); // Chặn 2 lớp bảo mật

// 1. Users
router.get('/users', adminController.getAllUsers); // Xem & Tìm kiếm (?keyword=...)
router.put('/users/:targetUserId/ban', adminController.banUser);
router.put('/users/:targetUserId/unban', adminController.unbanUser);
router.put('/users/:targetUserId/role', adminController.updateUserRole); // Đổi vai trò (ADMIN / USER)

// 2. Destinations
router.post('/destinations', adminController.createDestination);
router.put('/destinations/:destinationId', adminController.updateDestination); // Cập nhật
router.patch('/destinations/:destinationId/status', adminController.toggleDestinationStatus); // Ẩn / Hiện

// 3. Tours
router.post('/tours', adminController.createTour);
router.put('/tours/:tourId', adminController.updateTour); // Cập nhật thông tin & Lộ trình
router.patch('/tours/:tourId/status', adminController.updateTourStatus); // Đổi trạng thái (DRAFT / PUBLISHED / HIDDEN)
router.patch('/tours/:tourId/delete', adminController.softDeleteTour); // Xóa mềm (Đã code trước đó)

// 4. Bookings
router.get('/bookings', adminController.getAllBookings); // Xem danh sách & Lọc ?status=...
router.post('/bookings/:bookingId/force-cancel', adminController.forceCancelBooking); // Hủy đơn (Đã code trước đó)

// 5. Reviews
router.get('/reviews', adminController.getAllReviews); // Xem danh sách Review (?status=... & ?tourId=...)
router.patch('/reviews/:reviewId/hide', adminController.hideReview);
router.put('/reviews/:reviewId/reply', adminController.replyReview);

module.exports = router;