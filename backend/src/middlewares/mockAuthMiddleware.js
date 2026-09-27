/**
 * Mock Auth Middleware
 * Sử dụng tạm thời để giả lập một User đang đăng nhập,
 * phục vụ cho việc test chức năng Wishlist (Module 2, 5) trước khi Module 1 hoàn thiện.
 */

const mockAuthMiddleware = (req, res, next) => {
    // Giả lập thông tin UserID hợp lệ. 
    // Yêu cầu: Bạn cần tạo tay một dòng dữ liệu User có ID này trong bảng Users.
    req.user = {
        userId: '11111111-1111-1111-1111-111111111111', 
        role: 'USER'
    };
    
    console.log(`[MockAuth] Đang dùng User giả lập: ${req.user.userId}`);
    
    next();
};

module.exports = mockAuthMiddleware;
