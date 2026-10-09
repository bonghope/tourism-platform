const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware'); 
const bookingController = require('../controllers/bookingController'); 

// API 1: Khách hàng tạo đơn giữ chỗ mới
router.post('/', verifyToken, bookingController.createBooking);

// API 2: Hệ thống thanh toán gọi vào để xác nhận đã thu tiền

router.post('/webhook/payment', verifyToken, bookingController.paymentWebhook);

// User chủ động hủy đơn
router.post('/:bookingId/cancel', verifyToken, bookingController.cancelBookingByUser);

// Xem lịch sử đặt tour của user (VD: /api/bookings/user/U04)
router.get('/user/:userId', verifyToken, bookingController.getUserBookings);

// Xem chi tiết 1 hóa đơn (VD: /api/bookings/BKG-1789953963272)
router.get('/:bookingId', verifyToken, bookingController.getBookingDetails);

module.exports = router; 