const cron = require('node-cron');
const pool = require('../config/database');


cron.schedule('* * * * *', async () => {
    console.log('[CRON] Đang quét hệ thống để cập nhật trạng thái Booking...');
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Expired PENDING bookings are handled by cancelBooking.js.
        // Complete paid bookings only when a valid end date has passed.
        const [completedResult] = await connection.query(`
            UPDATE Bookings b
            JOIN TourDepartures d ON b.DepartureID = d.DepartureID
            SET b.Status = 'COMPLETED'
            WHERE b.Status = 'PAID' AND d.EndDate IS NOT NULL AND d.EndDate > d.StartDate AND d.EndDate <= UTC_TIMESTAMP()
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
