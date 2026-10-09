require('dotenv').config(); // Nạp duy nhất 1 lần ở đây

const express = require('express');
const cors = require('cors');

// Import routes
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const tourRoutes = require('./routes/tourRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const rateLimit = require('express-rate-limit');

const app = express();
require('./cron/cancelBooking');
app.use(cors());
app.use('/uploads/reviews', express.static(require('./utils/reviewImages').directory, { dotfiles:'deny', index:false, setHeaders:res => res.setHeader('X-Content-Type-Options','nosniff') }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Giới hạn tần suất gọi API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút." }
});
app.use('/api', apiLimiter);

// Health check route
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Travel Booking API is running' });
});

// API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/destinations', destinationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;

require('./cron/bookingWorker');
app.listen(PORT, () => {
    console.log(`Server đang chạy cực mượt tại http://localhost:${PORT}`);
});