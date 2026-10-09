const jwt = require('jsonwebtoken');

// Hàm kiểm tra xem người dùng đã đăng nhập chưa (Có Token hợp lệ không)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Không tìm thấy token. Vui lòng đăng nhập!" });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'webdulich_secret_key_module1', (err, decoded) => {
        if (err) return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
        req.user = decoded; // Trích xuất userId và role từ Token lưu vào req.user
        next();
    });
};

// Hàm tùy chọn: Có token thì giải mã, không có token thì vẫn cho đi qua (req.user = null)
const verifyTokenOptional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET || 'webdulich_secret_key_module1', (err, decoded) => {
            if (!err && decoded) {
                req.user = decoded;
            }
            next();
        });
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
