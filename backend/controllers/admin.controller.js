const pool = require('../config/database');
const { enqueueRating } = require('../utils/tourRatings');
const { validateTourDates } = require('../utils/tourDates');
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
const getAllTours = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT t.*,
          (SELECT td.DestinationID FROM Tour_Destinations td WHERE td.TourID=t.TourID LIMIT 1) AS DestinationID
          FROM Tours t ORDER BY t.StartDate DESC`);
        return res.json({ success: true, data: rows });
    } catch (error) { return res.status(500).json({ success: false, message: 'Không thể tải danh sách tour.' }); }
};
const createTour = async (req, res) => {
    try {
        const { title, slug, price, originalPrice, discountPercent, startDate, endDate, duration, maxSlots, destinationId, itinerary } = req.body;
        let dates;
        try { dates = validateTourDates(startDate, endDate); }
        catch (error) { return res.status(400).json({ success: false, message: error.message }); }
        if (price <= 0) return res.status(400).json({ success: false, message: "Giá tiền phải > 0" });

        const tourId = crypto.randomUUID();
        const itineraryJson = itinerary ? (typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary)) : null;

        const disc = Number(discountPercent) || 0;
        const origPrice = disc > 0 ? (Number(originalPrice) || Number(price)) : null;
        const finalPrice = Number(price) > 0 ? Number(price) : (origPrice ? Math.round(origPrice * (1 - disc / 100)) : 0);

        // Tạo Tour mới (Mặc định Status = DRAFT, AvailableSlots = maxSlots)
        await pool.query(
            `INSERT INTO Tours (TourID, Title, Slug, Price, OriginalPrice, DiscountPercent, StartDate, EndDate, Duration, MaxSlots, AvailableSlots, Itinerary, Status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
            [tourId, title, slug, finalPrice, origPrice, disc, dates.startDate, dates.endDate, duration, maxSlots, maxSlots, itineraryJson]
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

        if (!['PENDING', 'PAID'].includes(booking.Status)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Đơn hàng này đã bị hủy từ trước." });
        }

        // Cập nhật trạng thái thành REFUNDING (Chờ hoàn tiền)
        await connection.query("UPDATE Bookings SET Status = ? WHERE BookingID = ?", [booking.Status === 'PENDING' ? 'CANCELLED' : 'REFUNDING', bookingId]);

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
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [reviews] = await connection.query('SELECT TourID FROM Reviews WHERE ReviewID = ?', [req.params.reviewId]);
        if (!reviews.length) throw new Error('Không tìm thấy đánh giá.');
        await connection.query('SELECT TourID FROM Tours WHERE TourID = ? FOR UPDATE', [reviews[0].TourID]);
        await connection.query("UPDATE Reviews SET Status = 'HIDDEN' WHERE ReviewID = ?", [req.params.reviewId]);
        await enqueueRating(connection, reviews[0].TourID);
        await connection.commit();
        return res.status(200).json({ success:true, message:'Đã ẩn đánh giá vi phạm.' });
    } catch(error) {
        if (connection) await connection.rollback();
        return res.status(400).json({ success:false, message:error.message });
    } finally { if (connection) connection.release(); }
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
    let connection;
    try {
        const { tourId } = req.params;
        const { title, slug, price, originalPrice, discountPercent, destinationId, startDate, endDate, duration, maxSlots, status, itinerary } = req.body;
        if (maxSlots !== undefined && (!Number.isInteger(Number(maxSlots)) || Number(maxSlots) < 1)) throw new Error('Sức chứa phải là số nguyên dương.');
        if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) <= 0)) throw new Error('Giá tiền phải lớn hơn 0.');
        if (status && !['DRAFT','PUBLISHED','HIDDEN'].includes(status)) throw new Error('Trạng thái tour không hợp lệ.');
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [tours] = await connection.query('SELECT MaxSlots, AvailableSlots, StartDate, EndDate, Status FROM Tours WHERE TourID = ? FOR UPDATE', [tourId]);
        if (!tours.length) throw new Error('Không tìm thấy tour.');
        let dates;
        if (startDate !== undefined || endDate !== undefined || status === 'PUBLISHED') {
            dates = validateTourDates(startDate ?? tours[0].StartDate, endDate ?? tours[0].EndDate);
            if ((status ?? tours[0].Status) === 'PUBLISHED' && new Date(dates.startDate) <= new Date()) throw new Error('Tour mở bán phải có ngày khởi hành trong tương lai.');
        }
        const used = Number(tours[0].MaxSlots) - Number(tours[0].AvailableSlots);
        if (maxSlots !== undefined && Number(maxSlots) < used) throw new Error('Sức chứa không được nhỏ hơn số chỗ đã giữ/đã bán (' + used + ').');
        const slots = maxSlots === undefined ? Number(tours[0].AvailableSlots) : Number(maxSlots) - used;
        const itineraryJson = itinerary === undefined ? null : typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary);
        await connection.query(
            'UPDATE Tours SET Title = COALESCE(?, Title), Slug = COALESCE(?, Slug), Price = COALESCE(?, Price), StartDate = COALESCE(?, StartDate), Duration = COALESCE(?, Duration), MaxSlots = COALESCE(?, MaxSlots), AvailableSlots = ?, Status = COALESCE(?, Status), Itinerary = COALESCE(?, Itinerary) WHERE TourID = ?',
            [title ?? null, slug ?? null, price ?? null, dates?.startDate ?? null, duration ?? null, maxSlots ?? null, slots, status ?? null, itineraryJson, tourId]
        );
        if (originalPrice !== undefined || discountPercent !== undefined) {
            if (discountPercent !== undefined && (!Number.isFinite(Number(discountPercent)) || Number(discountPercent) < 0 || Number(discountPercent) >= 100)) throw new Error('Invalid discount percentage');
            await connection.query('UPDATE Tours SET OriginalPrice = ?, DiscountPercent = COALESCE(?, DiscountPercent) WHERE TourID = ?', [originalPrice ?? null, discountPercent ?? null, tourId]);
        }
        if (destinationId !== undefined) {
            await connection.query('DELETE FROM Tour_Destinations WHERE TourID = ?', [tourId]);
            if (destinationId) await connection.query('INSERT INTO Tour_Destinations (TourID, DestinationID) VALUES (?, ?)', [tourId, destinationId]);
        }
        if (dates) await connection.query('UPDATE Tours SET StartDate = ?, EndDate = ? WHERE TourID = ?', [dates.startDate, dates.endDate, tourId]);
        await connection.commit();
        return res.status(200).json({ success:true, message:'Cập nhật tour thành công!' });
    } catch (error) {
        if (connection) await connection.rollback();
        return res.status(400).json({ success:false, message:error.message });
    } finally { if (connection) connection.release(); }
};

const updateTourStatus = async (req, res) => {
    try {
        const { tourId } = req.params;
        const { status } = req.body; // 'DRAFT', 'PUBLISHED', 'HIDDEN'
        if (!['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ (chỉ nhận DRAFT, PUBLISHED, HIDDEN)." });
        }
        if (status === 'PUBLISHED') {
            const [rows] = await pool.query('SELECT StartDate, EndDate FROM Tours WHERE TourID = ?', [tourId]);
            if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy Tour.' });
            try {
                const dates = validateTourDates(rows[0].StartDate, rows[0].EndDate);
                if (new Date(dates.startDate) <= new Date()) throw new Error('Tour mở bán phải có ngày khởi hành trong tương lai.');
            } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
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
    getAllTours,
    banUser,
    unbanUser,
    getAllUsers,
    updateUserRole,
    getAllDestinations,
    createDestination,
    updateDestination,
    toggleDestinationStatus,
    createTour,
    updateTour,
    updateTourStatus,
    softDeleteTour,
    getAllBookings,
    forceCancelBooking,
    getAllReviews,
    hideReview,
    replyReview
};
