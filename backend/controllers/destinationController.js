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
            let query = `
                SELECT DISTINCT t.TourID, t.Title, t.Slug, t.Price, t.Duration, t.AverageRating, t.ReviewCount
                FROM Tours t
                INNER JOIN Tour_Destinations td ON t.TourID = td.TourID
                INNER JOIN User_Favorite_Destinations fd ON td.DestinationID = fd.DestinationID
                WHERE fd.UserID = ? AND t.Status = 'PUBLISHED'
                LIMIT 4
            `;
            const [rows] = await pool.query(query, [userId]);

            if (rows.length === 0) {
                const [fallbackRows] = await pool.query(`
                    SELECT TourID, Title, Slug, Price, Duration, AverageRating, ReviewCount
                    FROM Tours
                    WHERE Status = 'PUBLISHED'
                    ORDER BY AverageRating DESC, ReviewCount DESC
                    LIMIT 4
                `);
                for (let tour of fallbackRows) {
                    const [imgRows] = await pool.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
                    tour.images = imgRows.map(img => img.ImageURL);
                }
                return res.status(200).json({ success: true, data: fallbackRows });
            }

            for (let tour of rows) {
                const [imgRows] = await pool.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
                tour.images = imgRows.map(img => img.ImageURL);
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
