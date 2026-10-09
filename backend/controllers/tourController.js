const pool = require('../config/database');
const { ratingColumns } = require('../utils/tourRatings');

class TourController {
    // GET /api/tours - Lấy danh sách Tour (hỗ trợ lọc theo keyword, destination, giá, ngày)
    static async getAll(req, res, next) {
        try {
            const { page = 1, limit = 10, destinationId, keyword, minPrice, maxPrice, startDate, endDate } = req.query;
            const userId = req.user ? req.user.userId : null;

            let selectClause = `SELECT t.TourID, t.Title, t.Slug, t.Price, t.StartDate, t.Duration, t.MaxSlots, t.AvailableSlots, ${ratingColumns()}`;
            let fromClause = ` FROM Tours t`;
            if (destinationId) {
                fromClause += ` INNER JOIN Tour_Destinations td ON t.TourID = td.TourID`;
            }

            if (userId) {
                selectClause += `, IF(f.TourID IS NOT NULL, true, false) AS isFavorite`;
                fromClause += ` LEFT JOIN User_Favorite_Tours f ON t.TourID = f.TourID AND f.UserID = ?`;
            }

            let whereClause = ` WHERE t.Status = 'PUBLISHED'`;
            const params = [];

            if (userId) params.push(userId);
            if (destinationId) {
                whereClause += ` AND td.DestinationID = ?`;
                params.push(destinationId);
            }
            if (keyword && keyword.trim()) {
                whereClause += ` AND t.Title LIKE ?`;
                params.push(`%${keyword.trim()}%`);
            }
            if (minPrice !== undefined && minPrice !== '') {
                whereClause += ` AND t.Price >= ?`;
                params.push(Number(minPrice));
            }
            if (maxPrice !== undefined && maxPrice !== '') {
                whereClause += ` AND t.Price <= ?`;
                params.push(Number(maxPrice));
            }
            if (startDate) {
                whereClause += ` AND t.StartDate >= ?`;
                params.push(startDate);
            }
            if (endDate) {
                whereClause += ` AND t.StartDate <= ?`;
                params.push(endDate);
            }

            const countQuery = `SELECT COUNT(DISTINCT t.TourID) as total` + fromClause + whereClause;
            const [countRows] = await pool.query(countQuery, params);
            const totalItems = countRows[0].total;

            let query = selectClause + fromClause + whereClause + ` GROUP BY t.TourID ORDER BY t.StartDate ASC LIMIT ? OFFSET ?`;
            const offset = (page - 1) * limit;
            params.push(Number(limit), Number(offset));

            const [rows] = await pool.query(query, params);

            for (let tour of rows) {
                const [imgRows] = await pool.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
                tour.images = imgRows.map(img => img.ImageURL);
                tour.isFavorite = !!tour.isFavorite;
            }

            res.status(200).json({
                success: true,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: Number(page),
                data: rows
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tours/:id - Xem chi tiết tour
    static async getDetail(req, res, next) {
        try {
            const tourId = req.params.id;
            const userId = req.user ? req.user.userId : null;

            let tourQuery = `SELECT t.*, ${ratingColumns()}`;
            let fromClause = ` FROM Tours t`;
            const params = [tourId];

            if (userId) {
                tourQuery += `, IF(f.TourID IS NOT NULL, true, false) AS isFavorite`;
                fromClause += ` LEFT JOIN User_Favorite_Tours f ON t.TourID = f.TourID AND f.UserID = ?`;
                params.unshift(userId);
            }

            tourQuery += fromClause + ` WHERE t.TourID = ? AND t.Status = 'PUBLISHED'`;
            const [tourRows] = await pool.query(tourQuery, params);

            if (tourRows.length === 0) {
                return res.status(404).json({ success: false, message: "Không tìm thấy Tour này hoặc tour đã bị gỡ." });
            }

            const tour = tourRows[0];
            tour.isFavorite = !!tour.isFavorite;

            const [imageRows] = await pool.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ?`, [tourId]);
            tour.images = imageRows.map(img => img.ImageURL);

            res.status(200).json({ success: true, data: tour });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/tours/:id/favorite - Lưu / Hủy lưu tour yêu thích
    static async toggleFavorite(req, res, next) {
        try {
            const tourId = req.params.id;
            const userId = req.user.userId;

            const [existing] = await pool.query(`SELECT * FROM User_Favorite_Tours WHERE UserID = ? AND TourID = ?`, [userId, tourId]);

            let action;
            if (existing.length > 0) {
                await pool.query(`DELETE FROM User_Favorite_Tours WHERE UserID = ? AND TourID = ?`, [userId, tourId]);
                action = 'removed';
            } else {
                await pool.query(`INSERT INTO User_Favorite_Tours (UserID, TourID) VALUES (?, ?)`, [userId, tourId]);
                action = 'added';
            }

            res.status(200).json({
                success: true,
                message: action === 'added' ? 'Đã lưu tour vào danh sách yêu thích' : 'Đã xóa tour khỏi danh sách yêu thích',
                action
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/tours/wishlist - Lấy danh sách tour yêu thích
    static async getWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const query = `
                SELECT t.TourID, t.Title, t.Slug, t.Price, t.Duration, ${ratingColumns()}, f.SavedAt
                FROM Tours t
                INNER JOIN User_Favorite_Tours f ON t.TourID = f.TourID
                WHERE f.UserID = ? AND t.Status = 'PUBLISHED'
                ORDER BY f.SavedAt DESC
            `;
            const [rows] = await pool.query(query, [userId]);

            for (let tour of rows) {
                const [imgRows] = await pool.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
                tour.images = imgRows.map(img => img.ImageURL);
            }

            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TourController;
