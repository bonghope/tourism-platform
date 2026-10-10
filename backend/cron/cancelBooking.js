const cron = require('node-cron');
const pool = require('../config/database');

cron.schedule('* * * * *', async () => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Tìm khóa các đơn PENDING đã quá hạn 15 phút
        const [expiredBookings] = await connection.query(
            "SELECT BookingID, TourID, PassengerCount FROM Bookings WHERE Status = 'PENDING' AND HoldExpiresAt < NOW() FOR UPDATE"
        );

        if (expiredBookings.length > 0) {
            for (let booking of expiredBookings) {
                // 1. Trả lại vé vào bảng Tours
                await connection.query(
                    'UPDATE Tours SET AvailableSlots = AvailableSlots + ? WHERE TourID = ?',
                    [booking.PassengerCount, booking.TourID]
                );
                
                // 2. Đổi trạng thái đơn thành CANCELLED
                await connection.query(
                    "UPDATE Bookings SET Status = 'CANCELLED' WHERE BookingID = ?",
                    [booking.BookingID]
                );
            }
            console.log(`[CRONJOB] Đã quét và tự động hủy ${expiredBookings.length} đơn hàng quá hạn.`);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('[CRON ERROR] Lỗi dọn dẹp:', error.message);
    } finally {
        connection.release();
    }
});