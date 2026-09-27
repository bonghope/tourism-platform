const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import DB để kích hoạt luồng testConnection()
require('./config/db');

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); // Cấp phép Cross-Origin Request
app.use(express.json()); // Phân tích body chuẩn JSON (Body Parser)
app.use(express.urlencoded({ extended: true })); // Phân tích Form-Data

// --- ROUTES (ĐỊNH TUYẾN) ---
// Route kiểm tra trạng thái sức khỏe của Server (Health check)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server Backend đang hoạt động bình thường.'
    });
});

// Nhúng các Route của Module 2 và Module 5
const tourRoutes = require('./routes/tourRoutes');
const destinationRoutes = require('./routes/destinationRoutes');

app.use('/api/tours', tourRoutes);
app.use('/api/destinations', destinationRoutes);


// --- GLOBAL ERROR HANDLER ---
// Bắt lỗi toàn cục chuẩn theo yêu cầu của Coding Guidelines
app.use((err, req, res, next) => {
    console.error('❌ [Global Error]:', err);
    
    // Luôn trả về JSON theo chuẩn định dạng
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi hệ thống cục bộ. Vui lòng thử lại sau.'
    });
});

// --- KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend đang chạy tại http://localhost:${PORT}`);
});
