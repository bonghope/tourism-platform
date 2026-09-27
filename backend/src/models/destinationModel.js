const db = require('../config/db');

class DestinationModel {
    /**
     * Tìm kiếm thông minh địa danh theo tên hoặc từ khóa (Module 5)
     */
    static async searchDestinations(keyword) {
        let query = `
            SELECT DestinationID, Name, Slug, Description, ImageURL 
            FROM Destinations 
            WHERE Status = 'PUBLISHED' 
        `;
        const params = [];
        
        if (keyword) {
            const cleanKeyword = keyword.trim();
            if (cleanKeyword) {
                query += ` AND (Name LIKE ? OR Keywords LIKE ?)`;
                const searchTerm = `%${cleanKeyword}%`;
                params.push(searchTerm, searchTerm);
            }
        }
        
        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Lấy chi tiết một địa danh theo ID
     */
    static async getById(destinationId) {
        const query = `
            SELECT DestinationID, Name, Slug, Description, ImageURL 
            FROM Destinations 
            WHERE DestinationID = ? AND Status = 'PUBLISHED'
        `;
        const [rows] = await db.query(query, [destinationId]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Thuật toán: Lấy các Tour đi qua một địa danh (dùng JOIN bảng Tour_Destinations)
     */
    static async getToursByDestination(destinationId, userId = null) {
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

        const [rows] = await db.query(query, params);

        // Nối thêm ảnh đại diện cho Tour
        for (let tour of rows) {
            const [imgRows] = await db.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
            tour.images = imgRows.map(img => img.ImageURL);
            tour.isFavorite = !!tour.isFavorite;
        }

        return rows;
    }

    /**
     * Lấy danh sách Địa danh trong Wishlist của một User
     */
    static async getWishlist(userId) {
        const query = `
            SELECT d.DestinationID, d.Name, d.Slug, d.Description, d.ImageURL, f.SavedAt
            FROM Destinations d
            INNER JOIN User_Favorite_Destinations f ON d.DestinationID = f.DestinationID
            WHERE f.UserID = ? AND d.Status = 'PUBLISHED'
            ORDER BY f.SavedAt DESC
        `;
        const [rows] = await db.query(query, [userId]);
        return rows;
    }

    /**
     * Lưu / Bỏ lưu địa danh yêu thích (Wishlist)
     */
    static async toggleFavorite(userId, destinationId) {
        // Kiểm tra xem đã lưu chưa
        const checkQuery = `SELECT * FROM User_Favorite_Destinations WHERE UserID = ? AND DestinationID = ?`;
        const [existing] = await db.query(checkQuery, [userId, destinationId]);

        if (existing.length > 0) {
            // Đã lưu -> Thực hiện Bỏ lưu (DELETE)
            await db.query(`DELETE FROM User_Favorite_Destinations WHERE UserID = ? AND DestinationID = ?`, [userId, destinationId]);
            return { action: 'removed' };
        } else {
            // Chưa lưu -> Thực hiện Lưu (INSERT)
            await db.query(`INSERT INTO User_Favorite_Destinations (UserID, DestinationID) VALUES (?, ?)`, [userId, destinationId]);
            return { action: 'added' };
        }
    }

    /**
     * Lấy danh sách Tour đề xuất dựa trên các Địa danh yêu thích của User (Module 5)
     */
    static async getPersonalizedRecommendations(userId) {
        // Thuật toán: Lấy các Tour đi qua các địa danh mà User đã thả tim
        const query = `
            SELECT t.TourID, t.Title, t.Slug, t.Price, t.Duration, t.AverageRating, t.ReviewCount, 
                   IF(uft.TourID IS NOT NULL, true, false) AS isFavorite
            FROM Tours t
            INNER JOIN Tour_Destinations td ON t.TourID = td.TourID
            INNER JOIN User_Favorite_Destinations ufd ON td.DestinationID = ufd.DestinationID
            LEFT JOIN User_Favorite_Tours uft ON t.TourID = uft.TourID AND uft.UserID = ?
            WHERE ufd.UserID = ? AND t.Status = 'PUBLISHED'
            GROUP BY t.TourID
            ORDER BY t.AverageRating DESC, t.ReviewCount DESC
            LIMIT 10
        `;
        const [rows] = await db.query(query, [userId, userId]);

        // Lấy ảnh bìa
        for (let tour of rows) {
            const [imgRows] = await db.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
            tour.images = imgRows.map(img => img.ImageURL);
            tour.isFavorite = !!tour.isFavorite;
        }

        return rows;
    }
}

module.exports = DestinationModel;
