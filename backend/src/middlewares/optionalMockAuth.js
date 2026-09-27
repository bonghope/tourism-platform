const optionalMockAuth = (req, res, next) => {
    // Để cho phép test luồng Guest, kiểm tra Query param hoặc Header
    const isGuest = req.query.guest === 'true' || req.headers['x-guest-mode'] === 'true';

    if (!isGuest) {
        req.user = {
            userId: '11111111-1111-1111-1111-111111111111', 
            role: 'USER'
        };
    }
    
    next();
};

module.exports = optionalMockAuth;
