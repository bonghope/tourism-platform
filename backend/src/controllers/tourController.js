const TourModel = require('../models/tourModel');

class TourController {
    // GET /api/tours
    static async getAll(req, res, next) {
        try {
            const { minPrice, maxPrice, destinationId, keyword, startDate, endDate, page, limit } = req.query;
            const filters = {
                minPrice: minPrice ? parseFloat(minPrice) : null,
                maxPrice: maxPrice ? parseFloat(maxPrice) : null,
                destinationId: destinationId || null,
                keyword: keyword || null,
                startDate: startDate || null,
                endDate: endDate || null
            };
            
            const userId = req.user ? req.user.userId : null;
            const currentPage = page || 1;
            const currentLimit = limit || 10;

            const result = await TourModel.getAllTours(filters, userId, currentPage, currentLimit);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tours/:id
    static async getDetail(req, res, next) {
        try {
            const tourId = req.params.id;
            const userId = req.user ? req.user.userId : null;
            const tour = await TourModel.getTourById(tourId, userId);
            
            if (!tour) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Không tìm thấy Tour hoặc Tour chưa được mở bán." 
                });
            }

            res.status(200).json({ success: true, data: tour });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tours/wishlist
    static async getWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const tours = await TourModel.getWishlist(userId);
            res.status(200).json({ success: true, data: tours });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/tours/:id/favorite
    static async toggleFavorite(req, res, next) {
        try {
            const tourId = req.params.id;
            const userId = req.user.userId; // Trích xuất từ Mock Auth Middleware

            const result = await TourModel.toggleFavorite(userId, tourId);
            const message = result.action === 'added' 
                ? "Đã thêm Tour vào danh sách yêu thích" 
                : "Đã gỡ Tour khỏi danh sách yêu thích";
            
            res.status(200).json({ success: true, message, action: result.action });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TourController;
