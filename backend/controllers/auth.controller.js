const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

// Bộ nhớ đệm lưu mã OTP (hiệu lực 5 phút)
// Key: 'REG_' + email hoặc 'RESET_' + email
const otpStore = new Map();

// Bộ nhớ đệm chống Brute-force: { count: số lần sai, lockedUntil: thời điểm hết hạn khóa }
const failedAttempts = new Map();

// --- 1. ĐĂNG KÝ TÀI KHOẢN (BƯỚC 1: LẤY MÃ OTP CHỈ CẦN SĐT) ---
const register = async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        if (!phone || !phone.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Số điện thoại để nhận mã OTP." });
        }
        const cleanPhone = phone.trim();

        // 1. Kiểm tra Số điện thoại đã được đăng ký chưa
        const [existPhone] = await pool.query('SELECT UserID FROM Users WHERE Phone = ?', [cleanPhone]);
        if (existPhone.length > 0) {
            return res.status(400).json({ success: false, message: "Số điện thoại này đã được đăng ký tài khoản. Vui lòng đăng nhập." });
        }

        // 2. Email là tùy chọn (không bắt buộc). Nếu có nhập thì kiểm tra trùng lặp
        if (email && email.trim()) {
            const [existing] = await pool.query('SELECT UserID FROM Users WHERE Email = ?', [email.trim()]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: "Email này đã được sử dụng cho tài khoản khác." });
            }
        }

        // 3. Tạo mã OTP 6 số ngẫu nhiên (Hiệu lực 5 phút)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        const regPayload = {
            email: (email && email.trim()) ? email.trim() : null,
            phone: cleanPhone,
            password: password || null,
            fullName: fullName || null,
            otp,
            expiresAt
        };

        // Lưu vào bộ nhớ OTP theo Số điện thoại và Email (nếu có)
        otpStore.set('REG_' + cleanPhone, regPayload);
        if (email && email.trim()) {
            otpStore.set('REG_' + email.trim(), regPayload);
        }

        console.log(`[AUTH OTP] Đã tạo mã OTP ${otp} cho SĐT ${cleanPhone}`);

        return res.status(200).json({
            success: true,
            message: `Mã OTP đã được tạo (hiệu lực 5 phút). Đã gửi tới số điện thoại ${cleanPhone}.`,
            otp: otp // Trả về mã OTP phục vụ kiểm thử và hiển thị
        });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi mã OTP." });
    }
};

// Bước 2 của đăng ký: Xác thực mã OTP và lưu chính thức vào DB
const verifyRegisterOtp = async (req, res) => {
    try {
        const { email, phone, otp, password, fullName } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp Số điện thoại và mã OTP." });
        }

        const cleanPhone = phone.trim();
        let regData = otpStore.get('REG_' + cleanPhone);
        if (!regData && email) regData = otpStore.get('REG_' + email.trim());

        if (!regData) {
            return res.status(400).json({ success: false, message: "Không tìm thấy yêu cầu đăng ký hoặc mã OTP đã hết hạn." });
        }

        if (Date.now() > regData.expiresAt) {
            otpStore.delete('REG_' + cleanPhone);
            if (email) otpStore.delete('REG_' + email.trim());
            return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn (5 phút). Vui lòng bấm Lấy mã mới." });
        }

        if (regData.otp !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: "Mã OTP không chính xác!" });
        }

        const finalPassword = password || regData.password;
        const finalFullName = fullName || regData.fullName || ('Người dùng ' + cleanPhone.slice(-4));
        const finalEmail = (email && email.trim()) ? email.trim() : regData.email;

        if (!finalPassword) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Mật khẩu để hoàn tất đăng ký." });
        }

        // Mã OTP hợp lệ -> Băm mật khẩu (Cost factor 12) và lưu vào DB
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(finalPassword, salt);
        const userId = crypto.randomUUID();

        await pool.query(
            `INSERT INTO Users (UserID, Email, Phone, PasswordHash, FullName, AuthProvider, Status) 
             VALUES (?, ?, ?, ?, ?, 'LOCAL', 'ACTIVE')`,
            [userId, finalEmail, cleanPhone, passwordHash, finalFullName]
        );

        // Xóa thông tin tạm khỏi otpStore
        otpStore.delete('REG_' + cleanPhone);
        if (finalEmail) otpStore.delete('REG_' + finalEmail);

        return res.status(201).json({
            success: true,
            message: "Xác thực số điện thoại thành công! Tài khoản đã được tạo. Hãy đăng nhập để bắt đầu.",
            userId
        });
    } catch (error) {
        console.error("Lỗi xác thực đăng ký:", error);
    }
};

// --- 2. ĐĂNG NHẬP TRUYỀN THỐNG (ƯU TIÊN SỐ ĐIỆN THOẠI, ANTI BRUTE-FORCE 5 LẦN SAI KHÓA 15 PHÚT) ---
const login = async (req, res) => {
    try {
        const rawAccount = (req.body.phone || req.body.account || req.body.email || '').toString().trim();
        const password = (req.body.password || '').toString();

        if (!rawAccount || !password) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Số điện thoại và Mật khẩu." });
        }

        // Chuẩn hóa chuỗi SĐT (bỏ khoảng trắng, dấu chấm, gạch ngang)
        const normAccount = rawAccount.replace(/[\s.-]/g, '');
        const trackKey = normAccount || rawAccount;

        // 1. Kiểm tra khóa Anti Brute-force 15 phút trong bộ nhớ (theo chuỗi SĐT/tài khoản)
        let attempt = failedAttempts.get(trackKey) || failedAttempts.get(rawAccount);
        if (attempt && attempt.lockedUntil) {
            if (Date.now() < attempt.lockedUntil) {
                const remainingMinutes = Math.max(1, Math.ceil((attempt.lockedUntil - Date.now()) / (60 * 1000)));
                return res.status(403).json({
                    success: false,
                    isLocked: true,
                    remainingMinutes,
                    message: `Tài khoản tạm thời bị khóa do nhập sai quá 5 lần liên tiếp. Vui lòng thử lại sau ${remainingMinutes} phút hoặc bấm Quên mật khẩu để khôi phục.`
                });
            } else {
                // Đã qua 15 phút -> Tự động mở khóa
                failedAttempts.delete(trackKey);
                failedAttempts.delete(rawAccount);
                attempt = null;
            }
        }

        // 2. Tìm tài khoản trong Database (Ưu tiên Số điện thoại, hỗ trợ cả Email)
        const [users] = await pool.query(
            'SELECT * FROM Users WHERE Phone = ? OR Phone = ? OR Email = ?',
            [rawAccount, normAccount, rawAccount]
        );

        let user = null;
        if (users.length > 0) {
            user = users[0];

            // Kiểm tra trạng thái tài khoản
            if (user.Status === 'BANNED' || user.Status === 'DELETED') {
                return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị vô hiệu hóa hoặc xóa bởi Quản trị viên." });
            }

            // Kiểm tra khóa tạm 15 phút theo DB (LockedUntil) hoặc bộ nhớ
            const userLockAttempt = failedAttempts.get(user.UserID) || (user.Phone ? failedAttempts.get(user.Phone) : null) || attempt;
            const isDbLocked = user.LockedUntil && (new Date(user.LockedUntil).getTime() > Date.now());
            const isMemLocked = userLockAttempt && userLockAttempt.lockedUntil && (userLockAttempt.lockedUntil > Date.now());

            if (isDbLocked || isMemLocked) {
                const unlockTime = Math.max(
                    isDbLocked ? new Date(user.LockedUntil).getTime() : 0,
                    isMemLocked ? userLockAttempt.lockedUntil : 0
                );
                const remainingMinutes = Math.max(1, Math.ceil((unlockTime - Date.now()) / (60 * 1000)));
                return res.status(403).json({
                    success: false,
                    isLocked: true,
                    remainingMinutes,
                    message: `Tài khoản tạm thời bị khóa do nhập sai quá 5 lần liên tiếp. Vui lòng thử lại sau ${remainingMinutes} phút hoặc bấm Quên mật khẩu để khôi phục.`
                });
            } else if (user.Status === 'LOCKED') {
                // Đã qua thời hạn 15 phút -> Tự động giải phóng khóa trong DB
                await pool.query("UPDATE Users SET Status = 'ACTIVE', LockedUntil = NULL WHERE UserID = ?", [user.UserID]);
                user.Status = 'ACTIVE';
                user.LockedUntil = null;
                failedAttempts.delete(user.UserID);
                if (user.Phone) failedAttempts.delete(user.Phone);
                failedAttempts.delete(trackKey);
                failedAttempts.delete(rawAccount);
            }
        }

        // 3. Kiểm tra mật khẩu (nếu user tồn tại)
        let isMatch = false;
        if (user && user.PasswordHash) {
            isMatch = await bcrypt.compare(password, user.PasswordHash);
        }

        // XỬ LÝ KHI NHẬP SAI (Tài khoản không tồn tại HOẶC mật khẩu sai):
        if (!user || !isMatch) {
            let curAttempt = (user ? failedAttempts.get(user.UserID) : null) || failedAttempts.get(trackKey) || failedAttempts.get(rawAccount) || { count: 0, lockedUntil: null };
            curAttempt.count = (curAttempt.count || 0) + 1;

            if (curAttempt.count >= 5) {
                const lockUntilTime = Date.now() + 15 * 60 * 1000;
                curAttempt.lockedUntil = lockUntilTime;
                failedAttempts.set(trackKey, curAttempt);
                failedAttempts.set(rawAccount, curAttempt);
                if (user) {
                    failedAttempts.set(user.UserID, curAttempt);
                    if (user.Phone) failedAttempts.set(user.Phone, curAttempt);
                    await pool.query("UPDATE Users SET Status = 'LOCKED', LockedUntil = ? WHERE UserID = ?", [new Date(lockUntilTime), user.UserID]);
                }
                return res.status(403).json({
                    success: false,
                    isLocked: true,
                    remainingMinutes: 15,
                    message: "Bạn đã nhập sai tài khoản hoặc mật khẩu 5 lần liên tiếp. Hệ thống đã tạm khóa 15 phút để bảo mật."
                });
            }

            failedAttempts.set(trackKey, curAttempt);
            failedAttempts.set(rawAccount, curAttempt);
            if (user) {
                failedAttempts.set(user.UserID, curAttempt);
                if (user.Phone) failedAttempts.set(user.Phone, curAttempt);
            }
            const remaining = 5 - curAttempt.count;
            return res.status(400).json({
                success: false,
                remainingAttempts: remaining,
                message: `Số điện thoại hoặc mật khẩu không chính xác. Bạn còn ${remaining} lần thử trước khi bị khóa 15 phút.`
            });
        }

        // Đăng nhập thành công -> Xóa bộ đếm lỗi và mở khóa nếu trước đó bị tạm khóa
        failedAttempts.delete(trackKey);
        failedAttempts.delete(rawAccount);
        if (user.Phone) failedAttempts.delete(user.Phone);
        failedAttempts.delete(user.UserID);
        if (user.Status === 'LOCKED' || user.LockedUntil) {
            await pool.query("UPDATE Users SET Status = 'ACTIVE', LockedUntil = NULL WHERE UserID = ?", [user.UserID]);
            user.Status = 'ACTIVE';
            user.LockedUntil = null;
        }

        // 4. Cấp Access Token và Refresh Token
        const accessToken = jwt.sign(
            { userId: user.UserID, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        const refreshTokenStr = crypto.randomUUID() + crypto.randomUUID();
        const tokenId = crypto.randomUUID();
        const rTokenHash = await bcrypt.hash(refreshTokenStr, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await pool.query(
            `INSERT INTO Refresh_Tokens (TokenID, UserID, TokenHash, ExpiresAt) VALUES (?, ?, ?, ?)`,
            [tokenId, user.UserID, rTokenHash, expiresAt]
        );

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!",
            accessToken,
            refreshToken: refreshTokenStr,
            user: {
                userId: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                phone: user.Phone,
                role: user.Role,
                avatarUrl: user.AvatarURL
            }
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng nhập." });
    }
};

// --- 3. GỬI MÃ OTP CHO TÀI KHOẢN GOOGLE GMAIL ---
const requestGoogleOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.trim() || !email.includes('@')) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập địa chỉ Gmail hợp lệ để nhận mã OTP." });
        }
        const cleanEmail = email.trim().toLowerCase();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStore.set('GOOGLE_OTP_' + cleanEmail, { otp, expiresAt, email: cleanEmail });
        console.log(`[GOOGLE OTP] Đã tạo mã OTP ${otp} cho Gmail ${cleanEmail}`);

        return res.status(200).json({
            success: true,
            message: `Mã OTP đã được tạo (hiệu lực 5 phút). Đã gửi tới Gmail ${cleanEmail}.`,
            otp: otp // Trả về OTP phục vụ kiểm thử và hiển thị tiện lợi
        });
    } catch (error) {
        console.error("Lỗi gửi Google OTP:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi gửi mã OTP Gmail." });
    }
};

// --- 4. ĐĂNG NHẬP GOOGLE VỚI TÀI KHOẢN, MẬT KHẨU & OTP ---
const googleLogin = async (req, res) => {
    try {
        let { email, password, otp, fullName, avatarUrl, idToken } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập tài khoản Gmail." });
        }
        const cleanEmail = email.trim().toLowerCase();

        // Kiểm tra OTP nếu người dùng dùng luồng OTP Gmail
        if (otp) {
            const stored = otpStore.get('GOOGLE_OTP_' + cleanEmail);
            if (!stored) {
                return res.status(400).json({ success: false, message: "Không tìm thấy yêu cầu OTP hoặc mã đã hết hạn. Vui lòng bấm Lấy mã." });
            }
            if (Date.now() > stored.expiresAt) {
                otpStore.delete('GOOGLE_OTP_' + cleanEmail);
                return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn (5 phút). Vui lòng lấy mã mới." });
            }
            if (stored.otp !== otp.toString().trim()) {
                return res.status(400).json({ success: false, message: "Mã OTP không chính xác!" });
            }
            otpStore.delete('GOOGLE_OTP_' + cleanEmail);
        } else if (!idToken) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập mã OTP để xác thực đăng nhập Google." });
        }

        // Kiểm tra xem User đã có trong DB chưa
        const [users] = await pool.query('SELECT * FROM Users WHERE Email = ?', [cleanEmail]);
        let user;

        if (users.length === 0) {
            // Chưa có -> Tự động cấp phát tài khoản mới với AuthProvider = GOOGLE
            const userId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO Users (UserID, Email, FullName, AvatarURL, Role, AuthProvider, Status) 
                 VALUES (?, ?, ?, ?, 'USER', 'GOOGLE', 'ACTIVE')`,
                [userId, email, fullName || 'Khách Google', avatarUrl || null]
            );
            const [newUsers] = await pool.query('SELECT * FROM Users WHERE UserID = ?', [userId]);
            user = newUsers[0];
        } else {
            user = users[0];
            if (user.Status === 'BANNED' || user.Status === 'DELETED') {
                return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị vô hiệu hóa." });
            }
            // Cập nhật lại Avatar nếu Google có ảnh mới
            if (avatarUrl && avatarUrl !== user.AvatarURL) {
                await pool.query('UPDATE Users SET AvatarURL = ? WHERE UserID = ?', [avatarUrl, user.UserID]);
                user.AvatarURL = avatarUrl;
            }
        }

        // Cấp phát JWT Access Token & Refresh Token
        const accessToken = jwt.sign(
            { userId: user.UserID, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        const refreshTokenStr = crypto.randomUUID() + crypto.randomUUID();
        const tokenId = crypto.randomUUID();
        const rTokenHash = await bcrypt.hash(refreshTokenStr, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await pool.query(
            `INSERT INTO Refresh_Tokens (TokenID, UserID, TokenHash, ExpiresAt) VALUES (?, ?, ?, ?)`,
            [tokenId, user.UserID, rTokenHash, expiresAt]
        );

        return res.status(200).json({
            success: true,
            message: "Đăng nhập Google thành công!",
            accessToken,
            refreshToken: refreshTokenStr,
            user: {
                userId: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                phone: user.Phone,
                role: user.Role,
                avatarUrl: user.AvatarURL
            }
        });
    } catch (error) {
        console.error("Lỗi Google SSO:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng nhập Google." });
    }
};

// --- 4. ĐĂNG XUẤT (LOGOUT) ---
const logout = async (req, res) => {
    try {
        const userId = req.user.userId;
        await pool.query('UPDATE Refresh_Tokens SET IsRevoked = TRUE WHERE UserID = ?', [userId]);
        return res.status(200).json({ success: true, message: "Đăng xuất thành công, phiên làm việc đã bị thu hồi!" });
    } catch (error) {
        console.error("Lỗi đăng xuất:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng xuất." });
    }
};

// --- 5. ĐỔI MẬT KHẨU (YÊU CẦU MẬT KHẨU CŨ) ---
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập cả mật khẩu cũ và mật khẩu mới." });
        }

        const [users] = await pool.query('SELECT PasswordHash FROM Users WHERE UserID = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });

        const isMatch = await bcrypt.compare(oldPassword, users[0].PasswordHash || '');
        if (!isMatch) return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác!" });

        const salt = await bcrypt.genSalt(12);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE Users SET PasswordHash = ? WHERE UserID = ?', [hashedNewPassword, userId]);

        return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi đổi mật khẩu." });
    }
};

// --- 6. QUÊN MẬT KHẨU (KHÔI PHỤC BẰNG SỐ ĐIỆN THOẠI HOẶC EMAIL) ---
// Bước 1: Yêu cầu gửi OTP về Số điện thoại (hoặc Email)
const forgotPassword = async (req, res) => {
    try {
        const account = (req.body.phone || req.body.account || req.body.email || '').toString().trim();
        if (!account) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập Số điện thoại đã đăng ký." });
        }

        // Tìm kiếm tài khoản: Ưu tiên SĐT, sau đó là Email
        const [users] = await pool.query(
            'SELECT UserID, Phone, Email FROM Users WHERE Phone = ? OR Email = ?',
            [account, account]
        );
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "Số điện thoại / Tài khoản không tồn tại trong hệ thống." });
        }

        const user = users[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

        const payload = { otp, expiresAt, userId: user.UserID, phone: user.Phone, email: user.Email };
        otpStore.set('RESET_' + account, payload);
        if (user.Phone) otpStore.set('RESET_' + user.Phone, payload);
        if (user.Email) otpStore.set('RESET_' + user.Email, payload);

        const targetDesc = user.Phone ? `Số điện thoại ${user.Phone}` : `Email ${user.Email}`;
        console.log(`[RESET OTP] Đã tạo mã OTP ${otp} cho ${targetDesc}`);

        return res.status(200).json({
            success: true,
            message: `Mã OTP khôi phục mật khẩu đã được gửi đến ${targetDesc} (hiệu lực 5 phút).`,
            otp: otp,
            phone: user.Phone,
            email: user.Email
        });
    } catch (error) {
        console.error("Lỗi quên mật khẩu:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi yêu cầu quên mật khẩu." });
    }
};

// Bước 2: Nhập OTP và đặt lại mật khẩu mới
const resetPassword = async (req, res) => {
    try {
        const account = (req.body.phone || req.body.account || req.body.email || '').toString().trim();
        const { otp, newPassword } = req.body;

        if (!account || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ Số điện thoại, mã OTP và Mật khẩu mới." });
        }

        const resetData = otpStore.get('RESET_' + account);
        if (!resetData) {
            return res.status(400).json({ success: false, message: "Không tìm thấy yêu cầu khôi phục hoặc mã OTP đã hết hạn." });
        }

        if (Date.now() > resetData.expiresAt) {
            otpStore.delete('RESET_' + account);
            return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn 5 phút. Vui lòng lấy mã mới." });
        }

        if (resetData.otp !== otp.toString().trim()) {
            return res.status(400).json({ success: false, message: "Mã OTP không chính xác!" });
        }

        // Mã OTP đúng -> Băm mật khẩu mới và cập nhật DB theo UserID, mở khóa tài khoản
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await pool.query(
            "UPDATE Users SET PasswordHash = ?, Status = 'ACTIVE', LockedUntil = NULL WHERE UserID = ?",
            [passwordHash, resetData.userId]
        );

        // Xóa OTP khỏi bộ nhớ đệm và mở khóa mọi key liên quan
        otpStore.delete('RESET_' + account);
        if (resetData.phone) {
            otpStore.delete('RESET_' + resetData.phone);
            failedAttempts.delete(resetData.phone);
            failedAttempts.delete(resetData.phone.replace(/[\s.-]/g, ''));
        }
        if (resetData.email) {
            otpStore.delete('RESET_' + resetData.email);
            failedAttempts.delete(resetData.email);
        }
        failedAttempts.delete(resetData.userId);
        failedAttempts.delete(account);
        failedAttempts.delete(account.replace(/[\s.-]/g, ''));

        return res.status(200).json({
            success: true,
            message: "Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới."
        });
    } catch (error) {
        console.error("Lỗi đặt lại mật khẩu:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi đặt lại mật khẩu." });
    }
};

// ==========================================
// CẤP QUYỀN & LẤY DANH SÁCH TÀI KHOẢN ADMIN
// ==========================================
const getAdminList = async (req, res) => {
    try {
        const [admins] = await pool.query(
            "SELECT UserID, FullName, Email, Phone, Role, AvatarURL, CreatedAt FROM Users WHERE Role = 'ADMIN' ORDER BY CreatedAt ASC"
        );
        return res.status(200).json({ success: true, data: admins });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách Admin:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách Admin." });
    }
};

const getAdminToken = async (req, res) => {
    try {
        const { userId } = req.body || {};
        let query = "SELECT UserID, FullName, Email, Phone, Role, AvatarURL FROM Users WHERE Role = 'ADMIN'";
        let params = [];
        if (userId) {
            query += " AND UserID = ?";
            params.push(userId);
        }
        query += " LIMIT 1";

        const [admins] = await pool.query(query, params);
        if (admins.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản Quản trị viên." });
        }

        const admin = admins[0];
        const accessToken = jwt.sign(
            { userId: admin.UserID, role: 'ADMIN' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            accessToken,
            admin: {
                userId: admin.UserID,
                fullName: admin.FullName,
                email: admin.Email,
                phone: admin.Phone,
                role: admin.Role,
                avatarUrl: admin.AvatarURL
            }
        });
    } catch (error) {
        console.error("Lỗi cấp token Admin:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi cấp token Admin." });
    }
};

module.exports = {
    register,
    verifyRegisterOtp,
    login,
    googleLogin,
    requestGoogleOtp,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    getAdminList,
    getAdminToken
};