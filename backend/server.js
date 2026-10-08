require('dotenv').config(); // Nạp duy nhất 1 lần ở đây

const express = require('express');
const cors = require('cors');

// Import routes
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const tourRoutes = require('./routes/tourRoutes');
const destinationRoutes = require('./routes/destinationRoutes');

const app = express();
require('./cron/cancelBooking');
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Travel Booking API is running' });
});

// API endpoints
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