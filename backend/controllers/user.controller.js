const pool = require('../config/database');
const { departureColumns } = require('../utils/departures');
const { ratingColumns } = require('../utils/tourRatings');

// --- 1. LẤY & CẬP NHẬT HỒ SƠ KHÁCH HÀNG (USER PROFILE) ---
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [users] = await pool.query(
            'SELECT UserID, FullName, Email, Phone, AvatarURL, Role, Status, CreatedAt FROM Users WHERE UserID = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
        }

        return res.status(200).json({ success: true, user: users[0] });
    } catch (error) {
        console.error("Lỗi khi lấy thông tin hồ sơ:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin hồ sơ." });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { phone, fullName, avatarUrl } = req.body;
        const userId = req.user.userId;

        if (phone && phone.trim()) {
            const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
            const [currentUser] = await pool.query('SELECT Phone FROM Users WHERE UserID = ?', [userId]);
            const currentPhone = currentUser[0]?.Phone || '';
            if (cleanPhone && cleanPhone !== currentPhone) {
                return res.status(400).json({
                    success: false,
                    message: "Thay đổi số điện thoại yêu cầu xác thực bằng mã OTP. Vui lòng bấm 'Thay đổi số điện thoại'."
                });
            }
        }

        await pool.query(
            `UPDATE Users 
             SET FullName = COALESCE(?, FullName), 
                 AvatarURL = COALESCE(?, AvatarURL) 
             WHERE UserID = ?`,
            [fullName ? fullName.trim() : null, avatarUrl || null, userId]
        );

        return res.status(200).json({ success: true, message: "Cập nhật hồ sơ thành công!" });
    } catch (error) {
        console.error("Lỗi khi cập nhật hồ sơ:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật hồ sơ." });
    }
};

// --- 2. QUẢN LÝ TOUR YÊU THÍCH (WISHLIST) ---
const toggleWishlist = async (req, res) => {
    try {
        const { tourId } = req.body;
        const userId = req.user.userId;

        if (!tourId) {
            return res.status(400).json({ success: false, message: "Vui lòng truyền tourId." });
        }

        // Kiểm tra xem user đã lưu tour này chưa
        const [existing] = await pool.query(
            'SELECT * FROM User_Favorite_Tours WHERE UserID = ? AND TourID = ?',
            [userId, tourId]
        );

        if (existing.length > 0) {
            // Nếu có rồi -> Xóa khỏi danh sách (Bỏ thả tim)
            await pool.query('DELETE FROM User_Favorite_Tours WHERE UserID = ? AND TourID = ?', [userId, tourId]);
            return res.status(200).json({ success: true, message: "Đã bỏ yêu thích Tour này.", isFavorite: false });
        } else {
            // Nếu chưa có -> Thêm vào danh sách (Thả tim)
            await pool.query('INSERT INTO User_Favorite_Tours (UserID, TourID) VALUES (?, ?)', [userId, tourId]);
            return res.status(200).json({ success: true, message: "Đã thêm Tour vào danh sách yêu thích!", isFavorite: true });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật danh sách yêu thích:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật danh sách yêu thích." });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = `
            SELECT t.TourID, t.Title, t.Slug, t.Price, t.OriginalPrice, t.Duration, ${departureColumns()}, ${ratingColumns()}, f.SavedAt
            FROM User_Favorite_Tours f
            JOIN Tours t ON f.TourID = t.TourID
            WHERE f.UserID = ? AND t.Status = 'PUBLISHED' AND EXISTS(SELECT 1 FROM TourDepartures active_d WHERE active_d.TourID=t.TourID AND active_d.Status='OPEN' AND active_d.StartDate>UTC_TIMESTAMP() AND active_d.AvailableSlots>0)
            ORDER BY f.SavedAt DESC
        `;
        const [tours] = await pool.query(query, [userId]);
        return res.status(200).json({ success: true, total: tours.length, data: tours });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Tour yêu thích:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách Tour yêu thích." });
    }
};

// --- 3. QUẢN LÝ ĐIỂM ĐẾN YÊU THÍCH (FAVORITE DESTINATIONS) ---
const toggleFavoriteDestination = async (req, res) => {
    try {
        const { destinationId } = req.body;
        const userId = req.user.userId;

        if (!destinationId) {
            return res.status(400).json({ success: false, message: "Vui lòng truyền destinationId." });
        }

        const [existing] = await pool.query(
            'SELECT * FROM User_Favorite_Destinations WHERE UserID = ? AND DestinationID = ?',
            [userId, destinationId]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM User_Favorite_Destinations WHERE UserID = ? AND DestinationID = ?', [userId, destinationId]);
            return res.status(200).json({ success: true, message: "Đã xóa địa danh khỏi sở thích.", isFavorite: false });
        } else {
            await pool.query('INSERT INTO User_Favorite_Destinations (UserID, DestinationID) VALUES (?, ?)', [userId, destinationId]);
            return res.status(200).json({ success: true, message: "Đã thêm địa danh vào sở thích!", isFavorite: true });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật điểm đến yêu thích:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật điểm đến yêu thích." });
    }
};

const getFavoriteDestinations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = `
            SELECT d.DestinationID, d.Name, d.Slug, d.Description, d.ImageURL, f.SavedAt
            FROM User_Favorite_Destinations f
            JOIN Destinations d ON f.DestinationID = d.DestinationID
            WHERE f.UserID = ?
            ORDER BY f.SavedAt DESC
        `;
        const [destinations] = await pool.query(query, [userId]);
        return res.status(200).json({ success: true, total: destinations.length, data: destinations });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách điểm đến yêu thích:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách điểm đến yêu thích." });
    }
};

// --- 4. XÁC THỰC EMAIL RIÊNG CHO HỒ SƠ TÀI KHOẢN (OTP 5 PHÚT) ---
const emailOtpStore = new Map();

const requestEmailOtp = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập địa chỉ Email." });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Kiểm tra xem Email đã bị tài khoản khác sử dụng chưa
        const [existing] = await pool.query(
            'SELECT UserID FROM Users WHERE Email = ? AND UserID != ?',
            [cleanEmail, userId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Email này đã được sử dụng bởi một tài khoản khác." });
        }

        // Tạo mã OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        emailOtpStore.set('EMAIL_VERIFY_' + userId, {
            email: cleanEmail,
            otp,
            expiresAt
        });

        console.log(`[USER EMAIL OTP] User ${userId} yêu cầu xác thực email ${cleanEmail} với mã OTP: ${otp}`);

        return res.status(200).json({
            success: true,
            message: `Mã OTP xác thực đã được gửi tới email ${cleanEmail} (hiệu lực 5 phút).`,
            otp: otp
        });
    } catch (error) {
        console.error("Lỗi gửi OTP xác nhận email:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi mã xác thực email." });
    }
};

const verifyEmailOtp = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập mã OTP xác thực." });
        }

        const verifyData = emailOtpStore.get('EMAIL_VERIFY_' + userId);
        if (!verifyData) {
            return res.status(400).json({ success: false, message: "Chưa có yêu cầu xác thực email hoặc mã OTP đã hết hạn." });
        }

        if (Date.now() > verifyData.expiresAt) {
            emailOtpStore.delete('EMAIL_VERIFY_' + userId);
            return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn (5 phút). Vui lòng lấy mã mới." });
        }

        if (verifyData.otp !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: "Mã OTP không chính xác!" });
        }

        // Cập nhật Email vào database cho người dùng
        await pool.query('UPDATE Users SET Email = ? WHERE UserID = ?', [verifyData.email, userId]);
        emailOtpStore.delete('EMAIL_VERIFY_' + userId);

        return res.status(200).json({
            success: true,
            message: "Xác thực và liên kết Email vào tài khoản thành công!",
            email: verifyData.email
        });
    } catch (error) {
        console.error("Lỗi xác thực email:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi xác thực email." });
    }
};

// --- 5. XÁC THỰC THAY ĐỔI SỐ ĐIỆN THOẠI BẰNG OTP (5 PHÚT) ---
const phoneOtpStore = new Map();

const requestPhoneOtp = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phone } = req.body;

        if (!phone || !phone.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập số điện thoại mới." });
        }

        const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
        if (cleanPhone.length < 9 || cleanPhone.length > 11 || !/^\d+$/.test(cleanPhone)) {
            return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ (cần 9-11 chữ số)." });
        }

        // Kiểm tra xem số mới có trùng với số hiện tại không
        const [currentUser] = await pool.query('SELECT Phone FROM Users WHERE UserID = ?', [userId]);
        if (currentUser.length > 0 && currentUser[0].Phone === cleanPhone) {
            return res.status(400).json({ success: false, message: "Số điện thoại mới trùng với số điện thoại hiện tại." });
        }

        // Kiểm tra xem số điện thoại đã bị tài khoản khác sử dụng chưa
        const [existing] = await pool.query(
            'SELECT UserID FROM Users WHERE Phone = ? AND UserID != ?',
            [cleanPhone, userId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Số điện thoại này đã được sử dụng bởi một tài khoản khác." });
        }

        // Tạo mã OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        phoneOtpStore.set('PHONE_CHANGE_' + userId, {
            phone: cleanPhone,
            otp,
            expiresAt
        });

        console.log(`[USER PHONE OTP] User ${userId} yêu cầu đổi SĐT sang ${cleanPhone} với mã OTP: ${otp}`);

        return res.status(200).json({
            success: true,
            message: `Mã OTP xác thực đã được gửi tới số điện thoại ${cleanPhone} (hiệu lực 5 phút).`,
            otp: otp
        });
    } catch (error) {
        console.error("Lỗi gửi OTP đổi số điện thoại:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi mã xác thực số điện thoại." });
    }
};

const verifyPhoneOtp = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phone, otp } = req.body;

        if (!otp) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập mã OTP xác thực." });
        }

        const verifyData = phoneOtpStore.get('PHONE_CHANGE_' + userId);
        if (!verifyData) {
            return res.status(400).json({ success: false, message: "Chưa có yêu cầu đổi số điện thoại hoặc mã OTP đã hết hạn." });
        }

        if (Date.now() > verifyData.expiresAt) {
            phoneOtpStore.delete('PHONE_CHANGE_' + userId);
            return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn (5 phút). Vui lòng lấy mã mới." });
        }

        if (phone) {
            const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
            if (verifyData.phone !== cleanPhone) {
                return res.status(400).json({ success: false, message: "Số điện thoại không khớp với yêu cầu lấy mã OTP ban đầu." });
            }
        }

        if (verifyData.otp !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: "Mã OTP không chính xác!" });
        }

        // Kiểm tra xem số điện thoại đã bị tài khoản khác sử dụng chưa
        const [existing] = await pool.query(
            'SELECT UserID FROM Users WHERE Phone = ? AND UserID != ?',
            [verifyData.phone, userId]
        );
        if (existing.length > 0) {
            phoneOtpStore.delete('PHONE_CHANGE_' + userId);
            return res.status(400).json({ success: false, message: "Số điện thoại này đã được sử dụng bởi một tài khoản khác." });
        }

        // Cập nhật số điện thoại vào database cho người dùng
        await pool.query('UPDATE Users SET Phone = ? WHERE UserID = ?', [verifyData.phone, userId]);
        phoneOtpStore.delete('PHONE_CHANGE_' + userId);

        return res.status(200).json({
            success: true,
            message: "Thay đổi số điện thoại thành công!",
            phone: verifyData.phone
        });
    } catch (error) {
        console.error("Lỗi xác thực đổi số điện thoại:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi xác thực đổi số điện thoại." });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    toggleWishlist,
    getWishlist,
    toggleFavoriteDestination,
    getFavoriteDestinations,
    requestEmailOtp,
    verifyEmailOtp,
    requestPhoneOtp,
    verifyPhoneOtp
};
