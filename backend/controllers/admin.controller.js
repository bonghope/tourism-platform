const pool = require('../config/database');
const crypto = require('crypto');

// ==========================================
// 1. QUẢN LÝ TÀI KHOẢN (USERS)
// ==========================================
const banUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        // Đổi trạng thái thành BANNED
        await pool.query("UPDATE Users SET Status = 'BANNED' WHERE UserID = ?", [targetUserId]);
        // Thu hồi toàn bộ phiên đăng nhập (Đá văng tài khoản)
        await pool.query("UPDATE Refresh_Tokens SET IsRevoked = TRUE WHERE UserID = ?", [targetUserId]);

        return res.status(200).json({ success: true, message: "Đã khóa tài khoản thành công!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi khi khóa tài khoản." });
    }
};

const unbanUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        // Đổi trạng thái trở lại ACTIVE để người dùng có thể đăng nhập bình thường
        const [result] = await pool.query("UPDATE Users SET Status = 'ACTIVE' WHERE UserID = ?", [targetUserId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
        }

        return res.status(200).json({ success: true, message: "Đã mở khóa tài khoản thành công!" });
    } catch (error) {
        console.error("Lỗi khi mở khóa tài khoản:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi mở khóa tài khoản." });
    }
};

// ==========================================
// 2. QUẢN LÝ ĐỊA DANH (DESTINATIONS)
// ==========================================
const getAllDestinations = async (req, res) => {
    try {
        const [destinations] = await pool.query(
            'SELECT DestinationID, Name, Slug, Description, Keywords, ImageURL, Status, CreatedAt FROM Destinations ORDER BY CreatedAt DESC'
        );
        return res.status(200).json({ success: true, total: destinations.length, data: destinations });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách điểm đến cho admin:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách điểm đến." });
    }
};

const createDestination = async (req, res) => {
    try {
        const { name, slug, description, keywords, imageUrl } = req.body;
        const destinationId = crypto.randomUUID();

        await pool.query(
            `INSERT INTO Destinations (DestinationID, Name, Slug, Description, Keywords, ImageURL, Status) 
             VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
            [destinationId, name, slug, description, keywords, imageUrl || null]
        );
        return res.status(201).json({ success: true, message: "Tạo địa danh thành công!", destinationId });
    } catch (error) {
        console.error("Lỗi khi tạo địa danh:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi tạo địa danh." });
    }
};

const toggleDestinationStatus = async (req, res) => {
    try {
        const { destinationId } = req.params;
        const { status } = req.body; // 'PUBLISHED' hoặc 'HIDDEN'
        if (!['PUBLISHED', 'HIDDEN'].includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ (chỉ nhận PUBLISHED hoặc HIDDEN)." });
        }
        const [result] = await pool.query('UPDATE Destinations SET Status = ? WHERE DestinationID = ?', [status, destinationId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy địa danh." });
        }
        return res.status(200).json({ success: true, message: `Đã đổi trạng thái địa danh thành ${status}!` });
    } catch (error) {
        console.error("Lỗi khi đổi trạng thái địa danh:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái địa danh." });
    }
};

// ==========================================
// 3. QUẢN LÝ TOUR
// ==========================================
const createTour = async (req, res) => {
    try {
        const { title, slug, price, originalPrice, discountPercent, startDate, duration, maxSlots, destinationId, itinerary } = req.body;
        if (!price && !originalPrice) return res.status(400).json({ success: false, message: "Giá tiền phải > 0" });

        const tourId = crypto.randomUUID();
        const itineraryJson = itinerary ? (typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary)) : null;

        const disc = Number(discountPercent) || 0;
        const origPrice = disc > 0 ? (Number(originalPrice) || Number(price)) : null;
        const finalPrice = Number(price) > 0 ? Number(price) : (origPrice ? Math.round(origPrice * (1 - disc / 100)) : 0);

        // Tạo Tour mới (Mặc định Status = DRAFT, AvailableSlots = maxSlots)
        await pool.query(
            `INSERT INTO Tours (TourID, Title, Slug, Price, OriginalPrice, DiscountPercent, StartDate, Duration, MaxSlots, AvailableSlots, Itinerary, Status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
            [tourId, title, slug, finalPrice, origPrice, disc, startDate, duration, maxSlots, maxSlots, itineraryJson]
        );

        // Nối Tour với Địa danh (Bảng trung gian)
        if (destinationId) {
            await pool.query(`INSERT INTO Tour_Destinations (TourID, DestinationID) VALUES (?, ?)`, [tourId, destinationId]);
        }

        return res.status(201).json({ success: true, message: "Tạo Tour nháp thành công!", tourId });
    } catch (error) {
        console.error("LỖI DATABASE BÁO VỀ:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi tạo Tour." });
    }
};

const softDeleteTour = async (req, res) => {
    try {
        const { tourId } = req.params;
        // Quy tắc: Chỉ Xóa Mềm (Đổi status) để giữ nguyên vẹn hóa đơn cũ
        await pool.query("UPDATE Tours SET Status = 'DELETED' WHERE TourID = ?", [tourId]);
        return res.status(200).json({ success: true, message: "Đã xóa mềm Tour thành công." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi khi xóa Tour." });
    }
};

// ==========================================
// 4. QUẢN LÝ ĐƠN HÀNG (BOOKINGS) - HỦY NGOẠI LỆ
// ==========================================
const forceCancelBooking = async (req, res) => {
    // Dùng Transaction để đảm bảo tính toàn vẹn dữ liệu
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { bookingId } = req.params;

        // Lấy thông tin đơn hàng hiện tại
        const [bookings] = await connection.query('SELECT * FROM Bookings WHERE BookingID = ? FOR UPDATE', [bookingId]);
        if (bookings.length === 0) throw new Error("Không tìm thấy đơn hàng");
        const booking = bookings[0];

        if (booking.Status === 'CANCELLED' || booking.Status === 'REFUNDED') {
            return res.status(400).json({ success: false, message: "Đơn hàng này đã bị hủy từ trước." });
        }

        // Cập nhật trạng thái thành REFUNDING (Chờ hoàn tiền)
        await connection.query("UPDATE Bookings SET Status = 'REFUNDING' WHERE BookingID = ?", [bookingId]);

        // Hoàn trả lại số chỗ trống (AvailableSlots) cho Tour
        await connection.query(
            "UPDATE Tours SET AvailableSlots = AvailableSlots + ? WHERE TourID = ?",
            [booking.PassengerCount, booking.TourID]
        );

        await connection.commit(); // Xác nhận lưu DB
        return res.status(200).json({ success: true, message: "Đã hủy đơn và hoàn trả chỗ trống thành công!" });
    } catch (error) {
        await connection.rollback(); // Nếu có lỗi thì quay lại từ đầu
        console.error(error);
        return res.status(500).json({ success: false, message: "Lỗi khi hủy đơn hàng." });
    } finally {
        connection.release();
    }
};

// ==========================================
// 5. QUẢN LÝ ĐÁNH GIÁ (REVIEWS)
// ==========================================
const hideReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        // Ẩn bình luận rác
        await pool.query("UPDATE Reviews SET Status = 'HIDDEN' WHERE ReviewID = ?", [reviewId]);
        return res.status(200).json({ success: true, message: "Đã ẩn đánh giá vi phạm." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi khi ẩn đánh giá." });
    }
};

const replyReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { replyContent } = req.body;
        // Admin trả lời bình luận
        await pool.query("UPDATE Reviews SET OwnerReply = ? WHERE ReviewID = ?", [replyContent, reviewId]);
        return res.status(200).json({ success: true, message: "Đã trả lời đánh giá." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi khi trả lời đánh giá." });
    }
};

// ==========================================
// BỔ SUNG: DANH SÁCH & TÌM KIẾM USER
// ==========================================
const getAllUsers = async (req, res) => {
    try {
        const { keyword } = req.query; // Nhận từ khóa tìm kiếm trên URL (VD: ?keyword=manh)
        let query = 'SELECT UserID, Email, FullName, Phone, Role, Status, CreatedAt FROM Users';
        let params = [];

        if (keyword) {
            query += ' WHERE Email LIKE ? OR FullName LIKE ? OR Phone LIKE ?';
            const searchPattern = `%${keyword}%`;
            params = [searchPattern, searchPattern, searchPattern];
        }

        const [users] = await pool.query(query, params);
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách User." });
    }
};

// ==========================================
// BỔ SUNG: CẬP NHẬT ĐỊA DANH
// ==========================================
const updateDestination = async (req, res) => {
    try {
        const { destinationId } = req.params;
        const { name, slug, description, keywords, imageUrl, status } = req.body;

        await pool.query(
            `UPDATE Destinations 
             SET Name = COALESCE(?, Name), 
                 Slug = COALESCE(?, Slug), 
                 Description = COALESCE(?, Description), 
                 Keywords = COALESCE(?, Keywords),
                 ImageURL = COALESCE(?, ImageURL),
                 Status = COALESCE(?, Status)
             WHERE DestinationID = ?`,
            [name || null, slug || null, description || null, keywords || null, imageUrl || null, status || null, destinationId]
        );
        return res.status(200).json({ success: true, message: "Cập nhật địa danh thành công!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật địa danh." });
    }
};

// ==========================================
// BỔ SUNG: CẬP NHẬT TOUR & VÒNG ĐỜI TOUR
// ==========================================
const updateTour = async (req, res) => {
    try {
        const { tourId } = req.params;
        const { title, slug, price, originalPrice, discountPercent, startDate, duration, maxSlots, status, destinationId, itinerary } = req.body;
        const itineraryJson = itinerary !== undefined ? (typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary)) : null;

        const disc = discountPercent !== undefined ? Number(discountPercent) : null;
        const origPrice = originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : null;
        const finalPrice = price !== undefined ? Number(price) : null;

        await pool.query(
            `UPDATE Tours 
             SET Title = COALESCE(?, Title), 
                 Slug = COALESCE(?, Slug), 
                 Price = COALESCE(?, Price), 
                 OriginalPrice = ?,
                 DiscountPercent = COALESCE(?, DiscountPercent),
                 StartDate = COALESCE(?, StartDate), 
                 Duration = COALESCE(?, Duration), 
                 MaxSlots = COALESCE(?, MaxSlots), 
                 Status = COALESCE(?, Status),
                 Itinerary = COALESCE(?, Itinerary)
             WHERE TourID = ?`,
            [title || null, slug || null, finalPrice, origPrice, disc, startDate || null, duration || null, maxSlots || null, status || null, itineraryJson, tourId]
        );

        if (destinationId) {
            await pool.query('DELETE FROM Tour_Destinations WHERE TourID = ?', [tourId]);
            await pool.query('INSERT INTO Tour_Destinations (TourID, DestinationID) VALUES (?, ?)', [tourId, destinationId]);
        }

        return res.status(200).json({ success: true, message: "Cập nhật Tour thành công!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật Tour." });
    }
};

const getAllTours = async (req, res) => {
    try {
        const query = `
            SELECT t.TourID, t.Title, t.Slug, t.Price, t.OriginalPrice, t.DiscountPercent,
                   t.StartDate, t.Duration, t.MaxSlots, t.AvailableSlots, t.Status,
                   t.AverageRating, t.ReviewCount, t.Itinerary,
                   td.DestinationID
            FROM Tours t
            LEFT JOIN Tour_Destinations td ON t.TourID = td.TourID
            ORDER BY t.StartDate DESC
        `;
        const [rows] = await pool.query(query);
        return res.status(200).json({ success: true, total: rows.length, data: rows });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Tour cho admin:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách Tour." });
    }
};

const updateTourStatus = async (req, res) => {
    try {
        const { tourId } = req.params;
        const { status } = req.body; // 'DRAFT', 'PUBLISHED', 'HIDDEN'
        if (!['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ (chỉ nhận DRAFT, PUBLISHED, HIDDEN)." });
        }
        const [result] = await pool.query('UPDATE Tours SET Status = ? WHERE TourID = ?', [status, tourId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy Tour." });
        }
        return res.status(200).json({ success: true, message: `Đã đổi trạng thái Tour thành ${status}!` });
    } catch (error) {
        console.error("Lỗi khi đổi trạng thái Tour:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi đổi trạng thái Tour." });
    }
};

// ==========================================
// BỔ SUNG: XEM TẤT CẢ REVIEWS (CÓ BỘ LỌC)
// ==========================================
const getAllReviews = async (req, res) => {
    try {
        const { status, tourId } = req.query; // Lọc ?status=PUBLISHED, HIDDEN hoặc ?tourId=...
        let query = `
            SELECT r.ReviewID, r.BookingID, r.Rating, r.Content, r.Images, r.OwnerReply, r.Status, r.CreatedAt,
                   u.UserID, u.FullName AS ReviewerName, u.AvatarURL,
                   t.TourID, t.Title AS TourTitle
            FROM Reviews r
            JOIN Users u ON r.UserID = u.UserID
            JOIN Tours t ON r.TourID = t.TourID
        `;
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push('r.Status = ?');
            params.push(status.toUpperCase());
        }
        if (tourId) {
            conditions.push('r.TourID = ?');
            params.push(tourId);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY r.CreatedAt DESC';

        const [reviews] = await pool.query(query, params);
        return res.status(200).json({ success: true, total: reviews.length, data: reviews });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Review:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách Review." });
    }
};

// ==========================================
// BỔ SUNG: XEM DANH SÁCH BOOKING (CÓ LỌC THEO TRẠNG THÁI)
// ==========================================
const getAllBookings = async (req, res) => {
    try {
        const { status } = req.query; // Nhận trạng thái lọc nếu có: ?status=PENDING, PAID, REFUNDING...

        let query = `
            SELECT b.BookingID, b.CreatedAt, b.PassengerCount, b.TotalPrice, b.Status,
                   b.PaymentMethod, b.ContactName, b.ContactPhone,
                   u.FullName AS CustomerName, u.Email,
                   t.Title AS TourTitle, t.StartDate
            FROM Bookings b
            JOIN Users u ON b.UserID = u.UserID
            JOIN Tours t ON b.TourID = t.TourID
        `;
        const params = [];

        // Nếu admin truyền ?status= thì lọc theo trạng thái đó
        if (status) {
            query += ' WHERE b.Status = ?';
            params.push(status.toUpperCase());
        }

        query += ' ORDER BY b.CreatedAt DESC';

        const [bookings] = await pool.query(query, params);
        return res.status(200).json({ success: true, total: bookings.length, data: bookings });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Booking:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách Booking." });
    }
};

// ==========================================
// CẬP NHẬT VAI TRÒ NGƯỜI DÙNG (ADMIN / USER)
// ==========================================
const updateUserRole = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const { role } = req.body;

        if (!['ADMIN', 'USER'].includes(role)) {
            return res.status(400).json({ success: false, message: "Vai trò không hợp lệ (chỉ chấp nhận 'ADMIN' hoặc 'USER')." });
        }

        const [result] = await pool.query("UPDATE Users SET Role = ? WHERE UserID = ?", [role, targetUserId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
        }

        return res.status(200).json({ 
            success: true, 
            message: `Đã đổi vai trò người dùng thành ${role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Khách hàng (USER)'} thành công!` 
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật vai trò người dùng:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật vai trò." });
    }
};

module.exports = {
    banUser,
    unbanUser,
    getAllUsers,
    updateUserRole,
    getAllDestinations,
    createDestination,
    updateDestination,
    toggleDestinationStatus,
    createTour,
    getAllTours,
    updateTour,
    updateTourStatus,
    softDeleteTour,
    getAllBookings,
    forceCancelBooking,
    getAllReviews,
    hideReview,
    replyReview
};