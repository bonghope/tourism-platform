const cron = require('node-cron');
const pool = require('../config/database');


cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Đang quét hệ thống để cập nhật trạng thái Booking...');
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Tự động chuyển PENDING -> CANCELLED (Nếu quá 15 phút chưa thanh toán)
        const [expiredBookings] = await connection.query(
            "SELECT BookingID, TourID, PassengerCount FROM Bookings WHERE Status = 'PENDING' AND HoldExpiresAt < NOW() FOR UPDATE"
        );

        if (expiredBookings.length > 0) {
            for (let b of expiredBookings) {
                await connection.query("UPDATE Bookings SET Status = 'CANCELLED' WHERE BookingID = ?", [b.BookingID]);
                await connection.query("UPDATE Tours SET AvailableSlots = AvailableSlots + ? WHERE TourID = ?", [b.PassengerCount, b.TourID]);
            }
            console.log(`[CRON] Đã tự động HỦY và thu hồi vé cho ${expiredBookings.length} đơn hàng quá hạn 15 phút.`);
        }

        // 2. Tự động chuyển PAID -> COMPLETED (Nếu Tour đã kết thúc dựa vào EndDate)
        const [completedResult] = await connection.query(`
            UPDATE Bookings b 
            JOIN Tours t ON b.TourID = t.TourID 
            SET b.Status = 'COMPLETED' 
            WHERE b.Status = 'PAID' AND t.EndDate < NOW()
        `);

        if (completedResult.affectedRows > 0) {
            console.log(`[CRON] Đã chốt thành công ${completedResult.affectedRows} đơn hàng sang trạng thái COMPLETED.`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('[CRON] Lỗi khi chạy Worker:', error.message);
    } finally {
        if (connection) connection.release();
    }
});