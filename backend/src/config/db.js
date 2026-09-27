const mysql = require('mysql2/promise');
require('dotenv').config();

// Khởi tạo Connection Pool kết nối MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Hàm kiểm tra kết nối ngay khi khởi chạy server
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Đã kết nối thành công tới Database (MySQL)');
        connection.release();
    } catch (err) {
        console.error('❌ Lỗi kết nối Database:', err.message);
        // Tùy chọn: process.exit(1) nếu bắt buộc phải có DB mới chạy được server
    }
};

testConnection();

module.exports = pool;
