const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const departures = require('../controllers/departureController');
router.get('/tours/:tourId/departures',verifyToken,isAdmin,departures.list);
router.post('/tours/:tourId/departures',verifyToken,isAdmin,departures.create);
router.put('/tours/:tourId/departures/:departureId',verifyToken,isAdmin,departures.update);
router.use(verifyToken, isAdmin); // Chặn 2 lớp bảo mật

// 1. Users
router.get('/users', adminController.getAllUsers); // Xem & Tìm kiếm (?keyword=...)
router.put('/users/:targetUserId/ban', adminController.banUser);
router.put('/users/:targetUserId/unban', adminController.unbanUser);
router.put('/users/:targetUserId/role', adminController.updateUserRole); // Đổi vai trò (ADMIN / USER)

// 2. Destinations
router.get('/destinations', adminController.getAllDestinations); // Danh sách toàn bộ địa danh
router.post('/destinations', adminController.createDestination);
router.put('/destinations/:destinationId', adminController.updateDestination); // Cập nhật
router.patch('/destinations/:destinationId/status', adminController.toggleDestinationStatus); // Ẩn / Hiện

// 3. Tours
router.get('/tours', adminController.getAllTours); // Lấy toàn bộ Tour (Kèm giá gốc, khuyến mãi, draft/published/hidden)
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
