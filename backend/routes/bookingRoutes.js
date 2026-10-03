const express = require('express');
const router = express.Router(); 
const bookingController = require('../controllers/bookingController'); 

// API 1: Khách hàng tạo đơn giữ chỗ mới
router.post('/', bookingController.createBooking);

// API 2: Hệ thống thanh toán gọi vào để xác nhận đã thu tiền

router.post('/webhook/payment', bookingController.paymentWebhook);

// User chủ động hủy đơn
router.post('/:bookingId/cancel', bookingController.cancelBookingByUser);

// Xem lịch sử đặt tour của user (VD: /api/bookings/user/U04)
router.get('/user/:userId', bookingController.getUserBookings);

// Xem chi tiết 1 hóa đơn (VD: /api/bookings/BKG-1789953963272)
router.get('/:bookingId', bookingController.getBookingDetails);

module.exports = router; 