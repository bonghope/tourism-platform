const pool = require('../config/database');
const { syncRating } = require('../utils/tourRatings');
const { decodeImages, saveImages, removeImages } = require('../utils/reviewImages');

// 1. Khách hàng gửi đánh giá mới
exports.createReview = async (req, res) => {
    const { bookingId, rating, content, images } = req.body;
    const userId = req.user.userId;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof content !== 'string' || !content.trim() || content.length > 5000 || (images !== undefined && (!Array.isArray(images) || images.length > 5))) return res.status(400).json({ success:false, message:'Đánh giá phải từ 1–5 sao, có nội dung tối đa 5000 ký tự và tối đa 5 ảnh.' });
    let connection;
    const savedImages = [];

    try {
        const decodedImages = decodeImages(images);
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Lấy thông tin đơn hàng và ngày kết thúc Tour
        const [bookings] = await connection.query(
            `SELECT b.Status, b.UserID, b.TourID, t.EndDate 
             FROM Bookings b 
             JOIN Tours t ON b.TourID = t.TourID 
             WHERE b.BookingID = ? FOR UPDATE`,
            [bookingId]
        );

        if (bookings.length === 0) throw new Error('Không tìm thấy đơn hàng.');
        const booking = bookings[0];
        const tourId = booking.TourID;
        if (req.body.tourId && req.body.tourId !== tourId) throw new Error('Tour không khớp với đơn đặt.');
        if (!['PAID','COMPLETED'].includes(booking.Status) || !booking.EndDate) throw new Error('Đơn chưa đủ điều kiện đánh giá.');

        // 2. Validate Quyền Đánh giá (Pre-condition)
        if (booking.UserID !== userId) {
            throw new Error('Bạn không có quyền đánh giá đơn hàng của người khác.');
        }
        if (booking.Status == 'CANCELLED') {
            throw new Error('Bạn không thể đánh giá đơn hàng đã bị hủy.');
        }
        if (booking.Status == 'PENDING') {
            throw new Error('Bạn không thể đánh giá đơn hàng chưa thanh toán.');
        }
        if (booking.Status == 'PAID' && !booking.EndDate) {
            throw new Error('Chuyến đi chưa kết thúc, chưa thể đánh giá.');
        }

        // 3. Validate Cửa sổ thời gian (Time-window 30 ngày)
        const timeDiff = new Date().getTime() - new Date(booking.EndDate).getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        if (!Number.isFinite(daysDiff) || daysDiff < 0) throw new Error('Chuyến đi chưa kết thúc, chưa thể đánh giá.');
        if (daysDiff > 30) throw new Error('Ngoài thời gian đánh giá');

        // 4. Validate Tính duy nhất (1 Booking = 1 Review)
        const [existingReviews] = await connection.query(
            'SELECT ReviewID FROM Reviews WHERE BookingID = ?', 
            [bookingId]
        );
        if (existingReviews.length > 0) {
            throw new Error('Bạn đã đánh giá trải nghiệm cho đơn hàng này rồi.');
        }

        // 5. Sanitize Content (Lọc từ ngữ thô tục cơ bản - Profanity Check)
        const forbiddenWords = ['lừa đảo', 'tồi tệ', 'chửi thề']; 
        let sanitizedContent = content.trim();
        forbiddenWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            sanitizedContent = sanitizedContent.replace(regex, '***');
        });

        const imageUrls = await saveImages(decodedImages, savedImages);
        // 6. Lưu vào cơ sở dữ liệu
        const reviewId = 'REV-' + Date.now();
        await connection.query(
            `INSERT INTO Reviews (ReviewID, BookingID, UserID, TourID, Rating, Content, Images, Status, CreatedAt, UpdatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', NOW(), NOW())`,
            [reviewId, bookingId, userId, tourId, rating, sanitizedContent, JSON.stringify(imageUrls)]
        );

        await syncRating(connection, tourId);

        await connection.commit();
        res.status(201).json({ success: true, message: 'Cảm ơn bạn đã chia sẻ trải nghiệm!' });

    } catch (error) {
        if (connection) await connection.rollback();
        await removeImages(savedImages);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// 2. Xem danh sách đánh giá của 1 Tour (Đã tích hợp Phân trang)
exports.getTourReviews = async (req, res) => {
    const { tourId } = req.params;
    
    // Nhận tham số page và limit từ URL query (Mặc định: trang 1, 10 đánh giá/trang)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    let connection;

    try {
        connection = await pool.getConnection();
        
        // Truy vấn dữ liệu có sử dụng LIMIT và OFFSET để phân trang
        const [reviews] = await connection.query(
            `SELECT r.ReviewID, r.Rating, r.Content, r.Images, r.OwnerReply, DATE_FORMAT(r.CreatedAt, '%Y-%m-%dT%H:%i:%sZ') AS CreatedAt, u.FullName 
             FROM Reviews r 
             JOIN Users u ON r.UserID = u.UserID 
             WHERE r.TourID = ? AND r.Status = 'PUBLISHED' 
             ORDER BY r.CreatedAt DESC 
             LIMIT ? OFFSET ?`,
            [tourId, limit, offset]
        );

        // Truy vấn tổng số đánh giá để Frontend tính toán tổng số trang
        const [totalCountResult] = await connection.query(
            `SELECT COUNT(*) as total 
             FROM Reviews 
             WHERE TourID = ? AND Status = 'PUBLISHED'`,
            [tourId]
        );
        const totalReviews = totalCountResult[0].total;
        const totalPages = Math.ceil(totalReviews / limit);

        res.status(200).json({ 
            success: true, 
            data: reviews, 
            pagination: {
                currentPage: page,
                limit: limit,
                totalReviews: totalReviews,
                totalPages: totalPages
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};