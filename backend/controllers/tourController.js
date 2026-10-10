const pool = require('../config/database');
const { departureColumns } = require('../utils/departures');
const { ratingColumns } = require('../utils/tourRatings');

class TourController {
    // GET /api/tours - Lấy danh sách Tour (hỗ trợ lọc theo keyword, destination, giá, ngày)
    static async getAll(req, res, next) {
        try {
            const { page = 1, limit = 10, destinationId, keyword, minPrice, maxPrice, startDate, endDate } = req.query;
            const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
                && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
            const hasPrice = value => value !== undefined && value !== '';
            if (!Number.isSafeInteger(Number(page)) || Number(page) < 1
                || !Number.isSafeInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100
                || [minPrice, maxPrice].some(value => hasPrice(value) && (!Number.isFinite(Number(value)) || Number(value) < 0))
                || (hasPrice(minPrice) && hasPrice(maxPrice) && Number(minPrice) > Number(maxPrice))
                || (startDate && !validDate(startDate)) || (endDate && !validDate(endDate))
                || (startDate && endDate && startDate > endDate)
                || (keyword !== undefined && typeof keyword !== 'string')) {
                return res.status(400).json({ success: false, message: 'Bộ lọc không hợp lệ. Kiểm tra khoảng giá, ngày khởi hành và số trang.' });
            }
            const userId = req.user ? req.user.userId : null;

            let selectClause = `SELECT t.TourID, t.Title, t.Slug, t.Price, t.OriginalPrice, t.DiscountPercent, t.Duration, ${departureColumns()}, ${ratingColumns()}`;
            let fromClause = ` FROM Tours t`;
            if (destinationId) {
                fromClause += ` INNER JOIN Tour_Destinations td ON t.TourID = td.TourID`;
            }

            if (userId) {
                selectClause += `, IF(f.TourID IS NOT NULL, true, false) AS isFavorite`;
                fromClause += ` LEFT JOIN User_Favorite_Tours f ON t.TourID = f.TourID AND f.UserID = ?`;
            }

            let whereClause = ` WHERE t.Status = 'PUBLISHED' AND EXISTS(SELECT 1 FROM TourDepartures active_d WHERE active_d.TourID=t.TourID AND active_d.Status='OPEN' AND active_d.StartDate>UTC_TIMESTAMP() AND active_d.AvailableSlots>0)`;
            const params = [];
            if (req.query.promotion === 'true') {
                whereClause += ` AND t.OriginalPrice > t.Price `;
            }

            if (userId) params.push(userId);
            if (destinationId) {
                whereClause += ` AND td.DestinationID = ?`;
                params.push(destinationId);
            }
            if (keyword && keyword.trim()) {
                whereClause += ` AND (t.Title LIKE ? OR EXISTS (
                    SELECT 1 FROM Tour_Destinations searchTd
                    INNER JOIN Destinations searchD ON searchD.DestinationID = searchTd.DestinationID
                    WHERE searchTd.TourID = t.TourID AND searchD.Name LIKE ?))`;
                params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
            }
            if (minPrice !== undefined && minPrice !== '') {
                whereClause += ` AND t.Price >= ?`;
                params.push(Number(minPrice));
            }
            if (maxPrice !== undefined && maxPrice !== '') {
                whereClause += ` AND t.Price <= ?`;
                params.push(Number(maxPrice));
            }
            if (startDate || endDate) {
                whereClause += " AND EXISTS(SELECT 1 FROM TourDepartures ds WHERE ds.TourID=t.TourID AND ds.Status='OPEN' AND ds.StartDate>UTC_TIMESTAMP() AND ds.AvailableSlots>0";
                if (startDate) { whereClause += " AND ds.StartDate >= CONVERT_TZ(?,'+07:00','+00:00')"; params.push(startDate); }
                if (endDate) { whereClause += " AND ds.StartDate < DATE_ADD(CONVERT_TZ(?,'+07:00','+00:00'), INTERVAL 1 DAY)"; params.push(endDate); }
                whereClause += ')';
            }

            const countQuery = `SELECT COUNT(DISTINCT t.TourID) as total` + fromClause + whereClause;
            const [countRows] = await pool.query(countQuery, params);
            const totalItems = countRows[0].total;

            let query = selectClause + fromClause + whereClause + ` GROUP BY t.TourID ORDER BY StartDate ASC LIMIT ? OFFSET ?`;
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

            let tourQuery = `SELECT t.*, ${departureColumns()}, ${ratingColumns()}`;
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
            const [departures] = await pool.query("SELECT DepartureID, TourID, DATE_FORMAT(StartDate, '%Y-%m-%dT%H:%i:%sZ') AS StartDate, DATE_FORMAT(EndDate, '%Y-%m-%dT%H:%i:%sZ') AS EndDate, MaxSlots, AvailableSlots FROM TourDepartures WHERE TourID = ? AND Status='OPEN' AND StartDate > UTC_TIMESTAMP() AND AvailableSlots > 0 ORDER BY StartDate", [tourId]);
            tour.departures = departures;
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
                SELECT t.TourID, t.Title, t.Slug, t.Price, t.OriginalPrice, t.Duration, ${departureColumns()}, ${ratingColumns()}, f.SavedAt
                FROM Tours t
                INNER JOIN User_Favorite_Tours f ON t.TourID = f.TourID
                WHERE f.UserID = ? AND t.Status = 'PUBLISHED' AND EXISTS(SELECT 1 FROM TourDepartures active_d WHERE active_d.TourID=t.TourID AND active_d.Status='OPEN' AND active_d.StartDate>UTC_TIMESTAMP() AND active_d.AvailableSlots>0)
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
