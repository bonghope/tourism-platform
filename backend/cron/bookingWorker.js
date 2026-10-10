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
            JOIN Tours t ON b.TourID = t.TourID 
            SET b.Status = 'COMPLETED' 
            WHERE b.Status = 'PAID' AND t.EndDate IS NOT NULL AND t.EndDate > t.StartDate AND t.EndDate <= NOW()
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
