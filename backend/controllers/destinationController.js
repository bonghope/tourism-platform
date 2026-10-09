const pool = require('../config/database');

class DestinationController {
    // GET /api/destinations/search?keyword=...
    static async search(req, res, next) {
        try {
            const { keyword } = req.query;
            let query = `
                SELECT DestinationID, Name, Slug, Description, ImageURL 
                FROM Destinations 
                WHERE Status = 'PUBLISHED'
            `;
            const params = [];
            
            if (keyword && keyword.trim()) {
                query += ` AND (Name LIKE ? OR Keywords LIKE ?)`;
                const searchTerm = `%${keyword.trim()}%`;
                params.push(searchTerm, searchTerm);
            }
            
            const [rows] = await pool.query(query, params);
            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/destinations/recommendations
    static async getRecommendations(req, res, next) {
        try {
            const userId = req.user ? req.user.userId : null;
            let rows = [];

            // 1. Ưu tiên gợi ý theo Địa danh yêu thích của User
            if (userId) {
                const [destRows] = await pool.query(`
                    SELECT DISTINCT t.TourID, t.Title, t.Slug, t.Price, t.Duration, t.AverageRating, t.ReviewCount
                    FROM Tours t
                    INNER JOIN Tour_Destinations td ON t.TourID = td.TourID
                    INNER JOIN User_Favorite_Destinations fd ON td.DestinationID = fd.DestinationID
                    WHERE fd.UserID = ? AND t.Status = 'PUBLISHED'
                    LIMIT 4
                `, [userId]);
                rows = destRows;

                // 2. Nếu chưa có Địa danh yêu thích -> Gợi ý dựa trên Tour yêu thích của User
                if (rows.length === 0) {
                    const [tourRows] = await pool.query(`
                        SELECT DISTINCT t.TourID, t.Title, t.Slug, t.Price, t.Duration, t.AverageRating, t.ReviewCount
                        FROM Tours t
                        WHERE (
                            t.TourID IN (SELECT TourID FROM User_Favorite_Tours WHERE UserID = ?)
                            OR t.TourID IN (
                                SELECT td.TourID FROM Tour_Destinations td
                                WHERE td.DestinationID IN (
                                    SELECT DISTINCT td2.DestinationID 
                                    FROM User_Favorite_Tours ft 
                                    JOIN Tour_Destinations td2 ON ft.TourID = td2.TourID 
                                    WHERE ft.UserID = ?
                                )
                            )
                        )
                        AND t.Status = 'PUBLISHED'
                        LIMIT 4
                    `, [userId, userId]);
                    rows = tourRows;
                }
            }

            // 3. Fallback: Nếu không có hoặc khách chưa đăng nhập -> Lấy 4 tour nổi bật nhất
            if (rows.length === 0) {
                const [fallbackRows] = await pool.query(`
                    SELECT TourID, Title, Slug, Price, Duration, AverageRating, ReviewCount
                    FROM Tours
                    WHERE Status = 'PUBLISHED'
                    ORDER BY AverageRating DESC, ReviewCount DESC
                    LIMIT 4
                `);
                rows = fallbackRows;
            }

            // Gắn hình ảnh & trạng thái đã thả tim (isFavorite)
            let favSet = new Set();
            if (userId) {
                const [userFavs] = await pool.query(`SELECT TourID FROM User_Favorite_Tours WHERE UserID = ?`, [userId]);
                favSet = new Set(userFavs.map(f => f.TourID));
            }

            for (let tour of rows) {
                const [imgRows] = await pool.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
                tour.images = imgRows.map(img => img.ImageURL);
                tour.isFavorite = favSet.has(tour.TourID);
            }

            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/destinations/:id
    static async getDetail(req, res, next) {
        try {
            const destinationId = req.params.id;
            const query = `
                SELECT DestinationID, Name, Slug, Description, ImageURL 
                FROM Destinations 
                WHERE DestinationID = ? AND Status = 'PUBLISHED'
            `;
            const [rows] = await pool.query(query, [destinationId]);
            
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: "Không tìm thấy địa danh này." });
            }

            res.status(200).json({ success: true, data: rows[0] });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/destinations/:id/tours
    static async getTours(req, res, next) {
        try {
            const destinationId = req.params.id;
            const userId = req.user ? req.user.userId : null;

            let selectClause = `SELECT t.TourID, t.Title, t.Slug, t.Price, t.Duration, t.AverageRating, t.ReviewCount`;
            let fromClause = ` FROM Tours t INNER JOIN Tour_Destinations td ON t.TourID = td.TourID`;
            const params = [];

            if (userId) {
                selectClause += `, IF(f.TourID IS NOT NULL, true, false) AS isFavorite`;
                fromClause += ` LEFT JOIN User_Favorite_Tours f ON t.TourID = f.TourID AND f.UserID = ?`;
                params.push(userId);
            }

            let query = selectClause + fromClause + ` WHERE td.DestinationID = ? AND t.Status = 'PUBLISHED'`;
            params.push(destinationId);

            const [rows] = await pool.query(query, params);

            for (let tour of rows) {
                const [imgRows] = await pool.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
                tour.images = imgRows.map(img => img.ImageURL);
                tour.isFavorite = !!tour.isFavorite;
            }

            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            next(error);
        }
    }

    // POST /api/destinations/:id/favorite
    static async toggleFavorite(req, res, next) {
        try {
            const destinationId = req.params.id;
            const userId = req.user.userId;

            const [existing] = await pool.query(`SELECT * FROM User_Favorite_Destinations WHERE UserID = ? AND DestinationID = ?`, [userId, destinationId]);

            let action;
            if (existing.length > 0) {
                await pool.query(`DELETE FROM User_Favorite_Destinations WHERE UserID = ? AND DestinationID = ?`, [userId, destinationId]);
                action = 'removed';
            } else {
                await pool.query(`INSERT INTO User_Favorite_Destinations (UserID, DestinationID) VALUES (?, ?)`, [userId, destinationId]);
                action = 'added';
            }

            res.status(200).json({
                success: true,
                message: action === 'added' ? 'Đã lưu điểm đến vào danh sách yêu thích' : 'Đã xóa điểm đến khỏi danh sách yêu thích',
                action
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/destinations/wishlist
    static async getWishlist(req, res, next) {
        try {
            const userId = req.user.userId;
            const query = `
                SELECT d.DestinationID, d.Name, d.Slug, d.Description, d.ImageURL, fd.SavedAt
                FROM Destinations d
                INNER JOIN User_Favorite_Destinations fd ON d.DestinationID = fd.DestinationID
                WHERE fd.UserID = ? AND d.Status = 'PUBLISHED'
                ORDER BY fd.SavedAt DESC
            `;
            const [rows] = await pool.query(query, [userId]);
            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DestinationController;
