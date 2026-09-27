const DestinationModel = require('../models/destinationModel');

class DestinationController {
    // GET /api/destinations/search?keyword=...
    static async search(req, res, next) {
        try {
            const { keyword } = req.query;
            // Cho phép keyword rỗng để lấy toàn bộ địa danh
            const destinations = await DestinationModel.searchDestinations(keyword || '');
            res.status(200).json({ success: true, data: destinations });
        } catch (error) {
            next(error); // Bắt lỗi và chuyển cho Global Error Handler
        }
    }

    // GET /api/destinations/recommendations
    static async getRecommendations(req, res, next) {
        try {
            const userId = req.user.userId;
            const tours = await DestinationModel.getPersonalizedRecommendations(userId);
            res.status(200).json({ success: true, data: tours });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/destinations/:id
    static async getDetail(req, res, next) {
        try {
            const destinationId = req.params.id;
            const dest = await DestinationModel.getById(destinationId);
            
            if (!dest) {
                return res.status(404).json({ success: false, message: "Không tìm thấy địa danh này." });
            }

            res.status(200).json({ success: true, data: dest });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/destinations/:id/tours
    static async getTours(req, res, next) {
        try {
            const destinationId = req.params.id;
            const userId = req.user ? req.user.userId : null;
            const tours = await DestinationModel.getToursByDestination(destinationId, userId);
            res.status(200).json({ success: true, data: tours });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/destinations/wishlist
    static async getWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const destinations = await DestinationModel.getWishlist(userId);
            res.status(200).json({ success: true, data: destinations });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/destinations/:id/favorite
    static async toggleFavorite(req, res, next) {
        try {
            const destinationId = req.params.id;
            const userId = req.user.userId; // Trích xuất từ Mock Auth Middleware

            const result = await DestinationModel.toggleFavorite(userId, destinationId);
            const message = result.action === 'added' 
                ? "Đã thêm địa danh vào danh sách yêu thích" 
                : "Đã gỡ địa danh khỏi danh sách yêu thích";
            
            res.status(200).json({ success: true, message, action: result.action });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DestinationController;
