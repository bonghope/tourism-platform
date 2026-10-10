const pool = require('../config/database');

exports.createBooking = async (req, res) => {
    const { tourId, departureId, passengerCount, contactName, contactPhone } = req.body;
    const userId = req.user.userId;
    if (!departureId || !tourId) return res.status(400).json({success:false,message:'Vui lòng chọn lịch khởi hành.'});
    let connection; // Khai báo ở đây để khối catch/finally có thể nhìn thấy

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (!Number.isInteger(passengerCount) || passengerCount <= 0 || passengerCount > 10) {
           throw new Error('Số lượng khách phải từ 1 đến 10 người.');
}

        const [tours] = await connection.query(
    "SELECT d.AvailableSlots, t.Price, t.Status, d.Status AS DepartureStatus, (d.StartDate > UTC_TIMESTAMP()) AS FutureDeparture FROM TourDepartures d JOIN Tours t ON t.TourID=d.TourID WHERE d.DepartureID = ? AND d.TourID = ? FOR UPDATE",
    [departureId, tourId]
);

        if (tours.length === 0) {
            throw new Error('Tour không tồn tại hoặc đã ngừng bán.');
        }

        const tour = tours[0];
        if (tour.Status !== 'PUBLISHED') {
            throw new Error('Tour này hiện chưa được mở bán.');
        }
        if (tour.DepartureStatus !== 'OPEN' || !tour.FutureDeparture) {
            throw new Error('Tour này đã khởi hành, không thể đặt thêm.');
        }

        if (tour.AvailableSlots < passengerCount) {
            throw new Error(`Số chỗ trống không đủ. Chỉ còn ${tour.AvailableSlots} chỗ.`);
        }

        await connection.query(
            'UPDATE TourDepartures SET AvailableSlots = AvailableSlots - ? WHERE DepartureID = ?',
            [passengerCount, departureId]
        );

        const totalPrice = tour.Price * passengerCount;
        const bookingId = 'BKG-' + Date.now();

        await connection.query(
    `INSERT INTO Bookings (BookingID, UserID, TourID, DepartureID, ContactName, ContactPhone, PassengerCount, BasePrice,
    TotalPrice, Status, HoldExpiresAt, CreatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())`,
    [bookingId, userId, tourId, departureId, contactName, contactPhone, passengerCount, tour.Price, totalPrice]
);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Giữ chỗ thành công. Vui lòng thanh toán trong 15 phút.',
            bookingId: bookingId
        });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};


// Xử lý xác nhận thanh toán thành công
exports.paymentWebhook = async (req, res) => {
    // Webhook thường gửi data trong req.body kèm chữ ký (Signature)
    const { bookingId, transactionId, paymentMethod, signature } = req.body;
    let connection;

    // Giả lập kiểm tra Signature (Thực tế sẽ dùng HMAC SHA256 với Secret Key của VNPay/Momo)
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_PAYMENT !== 'true') {
        return res.status(503).json({ success: false, message: 'Thanh toán thử chưa được bật trên backend.' });
    }
    const isValidSignature = signature === 'MOCK_VALID_SIGNATURE';
    if (!isValidSignature) {
        return res.status(403).json({ success: false, message: 'Chữ ký không hợp lệ!' });
    }

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [bookings] = await connection.query(
            "SELECT UserID, Status, HoldExpiresAt, TIMESTAMPDIFF(SECOND, NOW(), HoldExpiresAt) AS HoldRemainingSeconds FROM Bookings WHERE BookingID = ? FOR UPDATE", [bookingId]
        );

        if (bookings.length === 0) throw new Error('Không tìm thấy hóa đơn.');
        if (bookings[0].UserID !== req.user.userId) throw new Error('Bạn không có quyền thanh toán đơn này.');

        // Tính luỹ đẳng (Idempotency): Nếu đã PAID rồi thì return 200 OK luôn, không làm gì cả
        if (bookings[0].Status === 'PAID') {
            await connection.commit();
            return res.status(200).json({ success: true, message: 'Đơn hàng đã được ghi nhận thanh toán trước đó.' });
        }

        if (bookings[0].Status !== 'PENDING') {
            throw new Error('Đơn hàng đã bị hủy, thanh toán thất bại.');
        }

        if (bookings[0].HoldRemainingSeconds == null || Number(bookings[0].HoldRemainingSeconds) <= 0) {
            throw new Error('Đã hết thời gian giữ chỗ. Vui lòng đặt tour lại.');
        }

        // Đổi trạng thái PENDING -> PAID và lưu TransactionID
        await connection.query(
            "UPDATE Bookings SET Status = 'PAID', PaymentMethod = ?, TransactionID = ? WHERE BookingID = ?",
            [paymentMethod, transactionId, bookingId]
        );

        await connection.commit();
        res.status(200).json({ success: true, message: 'Xác nhận thanh toán thành công.' });
        // TODO: Gọi hàm gửi Email E-ticket tại đây
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// huỷ chủ động
exports.cancelBookingByUser = async (req, res) => {
    const { bookingId } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Lấy thông tin đơn hàng và nối với bảng Tours để check StartDate
        const [bookings] = await connection.query(
            `SELECT b.UserID, b.Status, b.PassengerCount, b.TourID, b.DepartureID, DATE_FORMAT(d.StartDate, '%Y-%m-%dT%H:%i:%sZ') AS StartDate
             FROM Bookings b JOIN Tours t ON b.TourID = t.TourID JOIN TourDepartures d ON d.DepartureID=b.DepartureID
             WHERE b.BookingID = ? FOR UPDATE`,
            [bookingId]
        );

        if (bookings.length === 0) throw new Error('Không tìm thấy hóa đơn.');
        const booking = bookings[0];
        if (booking.UserID !== req.user.userId) throw new Error('Bạn không có quyền hủy đơn này.');

        if (booking.Status === 'PENDING') {
            // KỊCH BẢN 1: Hủy đơn PENDING -> CANCELLED, hoàn vé lập tức
            await connection.query(
                "UPDATE Bookings SET Status = 'CANCELLED' WHERE BookingID = ?", [bookingId]
            );
            await connection.query(
                "UPDATE TourDepartures SET AvailableSlots = AvailableSlots + ? WHERE DepartureID = ?",
                [booking.PassengerCount, booking.DepartureID]
            );
            await connection.commit();
            return res.status(200).json({ success: true, message: 'Đã hủy đơn giữ chỗ thành công.' });

        } else if (booking.Status === 'PAID') {
            // KỊCH BẢN 2: Hủy đơn PAID -> Kiểm tra Time-window >= 72h
            const timeDiff = new Date(booking.StartDate).getTime() - new Date().getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff < 72) {
                throw new Error('Không thể hủy đơn. Thời gian khởi hành còn dưới 72 giờ (Sunk cost policy).');
            }

            await connection.query(
                "UPDATE Bookings SET Status = 'REFUNDING' WHERE BookingID = ?", [bookingId]
            );
            await connection.query(
                "UPDATE TourDepartures SET AvailableSlots = AvailableSlots + ? WHERE DepartureID = ?",
                [booking.PassengerCount, booking.DepartureID]
            );
            // TODO: Ghi Log hệ thống tại đây
            await connection.commit();
            return res.status(200).json({ success: true, message: 'Đơn hàng đã chuyển sang trạng thái chờ hoàn tiền.' });

        } else {
            throw new Error(`Không thể hủy đơn hàng đang ở trạng thái: ${booking.Status}`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};


// Xem lịch sử đặt tour của một User
exports.getUserBookings = async (req, res) => {
    const userId = req.user.userId;
    if (req.params.userId !== userId) return res.status(403).json({ success:false, message:'Bạn không có quyền xem lịch sử này.' });
    let connection;

    try {
        connection = await pool.getConnection();
        const [bookings] = await connection.query(
            `SELECT b.BookingID, b.TourID, t.Title, b.PassengerCount, b.TotalPrice, b.Status,
                    DATE_FORMAT(b.CreatedAt, '%Y-%m-%dT%H:%i:%sZ') AS CreatedAt,
                    DATE_FORMAT(b.HoldExpiresAt, '%Y-%m-%dT%H:%i:%sZ') AS HoldExpiresAt, DATE_FORMAT(d.StartDate, '%Y-%m-%dT%H:%i:%sZ') AS StartDate
             FROM Bookings b
             JOIN Tours t ON b.TourID = t.TourID JOIN TourDepartures d ON d.DepartureID=b.DepartureID
             WHERE b.UserID = ?
             ORDER BY b.CreatedAt DESC`,
            [userId]
        );

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Xem chi tiết một hóa đơn (Booking) cụ thể
exports.getBookingDetails = async (req, res) => {
    const { bookingId } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        const [bookings] = await connection.query(
            `SELECT b.*,
                    DATE_FORMAT(b.CreatedAt, '%Y-%m-%dT%H:%i:%sZ') AS CreatedAt,
                    DATE_FORMAT(b.HoldExpiresAt, '%Y-%m-%dT%H:%i:%sZ') AS HoldExpiresAt,
                    t.Title, DATE_FORMAT(d.StartDate, '%Y-%m-%dT%H:%i:%sZ') AS StartDate, DATE_FORMAT(d.EndDate, '%Y-%m-%dT%H:%i:%sZ') AS EndDate, EXISTS(SELECT 1 FROM Reviews r WHERE r.BookingID = b.BookingID) AS HasReview, TIMESTAMPDIFF(SECOND, NOW(), b.HoldExpiresAt) AS HoldRemainingSeconds
             FROM Bookings b
             JOIN Tours t ON b.TourID = t.TourID JOIN TourDepartures d ON d.DepartureID=b.DepartureID
             WHERE b.BookingID = ? AND b.UserID = ?`,
            [bookingId, req.user.userId]
        );

        if (bookings.length === 0) {
            throw new Error('Không tìm thấy hóa đơn.');
        }

        res.status(200).json({ success: true, data: bookings[0] });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
