require('dotenv').config(); // Nạp duy nhất 1 lần ở đây

const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
require('./cron/cancelBooking');
app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingRoutes);
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 3000;

require('./cron/bookingWorker');
app.listen(PORT, () => {
    console.log(`Server đang chạy cực mượt tại http://localhost:${PORT}`);
});