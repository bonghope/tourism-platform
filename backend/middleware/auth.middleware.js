const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Hàm kiểm tra xem người dùng đã đăng nhập chưa (Có Token hợp lệ & Tài khoản còn hoạt động trong CSDL)
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Không tìm thấy token. Vui lòng đăng nhập!" });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'webdulich_secret_key_module1');
    } catch (err) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    if (!decoded || !decoded.userId) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    try {
        // Kiểm tra trạng thái hiện tại trong CSDL để vô hiệu hóa token đã cấp khi tài khoản bị khóa/xóa
        const [users] = await pool.query(
            'SELECT UserID, FullName, Email, Role, Status FROM Users WHERE UserID = ?', 
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Tài khoản không tồn tại hoặc đã bị xóa khỏi hệ thống." 
            });
        }

        const currentUser = users[0];
        if (currentUser.Status === 'BANNED') {
            return res.status(403).json({ 
                success: false, 
                code: 'ACCOUNT_BANNED',
                message: "Tài khoản của bạn đã bị khóa. Mọi phiên truy cập đã bị vô hiệu hóa." 
            });
        }

        if (currentUser.Status === 'DELETED') {
            return res.status(403).json({ 
                success: false, 
                code: 'ACCOUNT_DELETED',
                message: "Tài khoản của bạn đã bị xóa. Phiên truy cập không còn hiệu lực." 
            });
        }

        // Gán dữ liệu xác thực mới nhất từ CSDL vào req.user (đồng bộ role và status thời gian thực)
        req.user = {
            ...decoded,
            userId: currentUser.UserID,
            role: currentUser.Role,
            status: currentUser.Status,
            fullName: currentUser.FullName,
            email: currentUser.Email
        };

        next();
    } catch (dbError) {
        console.error("Lỗi xác thực trạng thái tài khoản trong CSDL:", dbError);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi máy chủ khi kiểm tra trạng thái tài khoản." 
        });
    }
};

// Hàm tùy chọn: Có token thì giải mã và kiểm tra CSDL, không có token thì vẫn cho đi qua (req.user = null)
const verifyTokenOptional = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'webdulich_secret_key_module1');
        } catch {
            decoded = null;
        }

        if (decoded && decoded.userId) {
            try {
                const [users] = await pool.query(
                    'SELECT UserID, Role, Status FROM Users WHERE UserID = ?',
                    [decoded.userId]
                );
                if (users.length > 0 && users[0].Status !== 'BANNED' && users[0].Status !== 'DELETED') {
                    req.user = {
                        ...decoded,
                        userId: users[0].UserID,
                        role: users[0].Role,
                        status: users[0].Status
                    };
                } else {
                    req.user = null;
                }
            } catch {
                req.user = null;
            }
        } else {
            req.user = null;
        }
        next();
    } else {
        const mockUserId = req.headers['x-mock-user-id'];
        if (mockUserId) {
            req.user = { userId: mockUserId, role: 'USER' };
        } else {
            req.user = null;
        }
        next();
    }
};

// Hàm kiểm tra xem người dùng có phải là Admin không (Dành cho Module 6)
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập (Cần quyền Admin)" });
    }
};

module.exports = { verifyToken, verifyTokenOptional, isAdmin };
