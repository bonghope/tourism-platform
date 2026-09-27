const db = require('../config/db');

class TourModel {
    /**
     * Lấy danh sách Tour đang mở bán (có hỗ trợ lọc cơ bản)
     */
    static async getAllTours(filters = {}, userId = null, page = 1, limit = 10) {
        let selectClause = `SELECT t.TourID, t.Title, t.Slug, t.Price, t.StartDate, t.Duration, t.MaxSlots, t.AvailableSlots, t.AverageRating, t.ReviewCount`;
        
        let fromClause = ` FROM Tours t`;
        if (filters.destinationId) {
            fromClause += ` INNER JOIN Tour_Destinations td ON t.TourID = td.TourID`;
        }

        if (userId) {
            selectClause += `, IF(f.TourID IS NOT NULL, true, false) AS isFavorite`;
            fromClause += ` LEFT JOIN User_Favorite_Tours f ON t.TourID = f.TourID AND f.UserID = ?`;
        }

        let whereClause = ` WHERE t.Status = 'PUBLISHED'`;
        const params = [];

        if (userId) {
            params.push(userId);
        }

        if (filters.destinationId) {
            whereClause += ` AND td.DestinationID = ?`;
            params.push(filters.destinationId);
        }

        if (filters.keyword) {
            whereClause += ` AND t.Title LIKE ?`;
            params.push(`%${filters.keyword.trim()}%`);
        }

        if (filters.minPrice !== undefined && filters.minPrice !== null) {
            whereClause += ` AND t.Price >= ?`;
            params.push(filters.minPrice);
        }
        if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
            whereClause += ` AND t.Price <= ?`;
            params.push(filters.maxPrice);
        }
        if (filters.startDate) {
            whereClause += ` AND t.StartDate >= ?`;
            params.push(filters.startDate);
        }
        if (filters.endDate) {
            whereClause += ` AND t.StartDate <= ?`;
            params.push(filters.endDate);
        }

        const countQuery = `SELECT COUNT(DISTINCT t.TourID) as total` + fromClause + whereClause;
        const [countRows] = await db.query(countQuery, params);
        const totalItems = countRows[0].total;

        let query = selectClause + fromClause + whereClause + ` GROUP BY t.TourID ORDER BY t.StartDate ASC LIMIT ? OFFSET ?`;
        
        const offset = (page - 1) * limit;
        params.push(Number(limit), Number(offset));
        
        const [rows] = await db.query(query, params);

        // Fetch cover images
        for (let tour of rows) {
            const [imgRows] = await db.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
            tour.images = imgRows.map(img => img.ImageURL);
            tour.isFavorite = !!tour.isFavorite; // Convert 1/0 to boolean
        }

        return {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: Number(page),
            data: rows
        };
    }

    /**
     * Xem chi tiết Tour (kèm danh sách hình ảnh)
     */
    static async getTourById(tourId, userId = null) {
        let tourQuery = `SELECT t.*`;
        let fromClause = ` FROM Tours t`;
        const params = [tourId];

        if (userId) {
            tourQuery += `, IF(f.TourID IS NOT NULL, true, false) AS isFavorite`;
            fromClause += ` LEFT JOIN User_Favorite_Tours f ON t.TourID = f.TourID AND f.UserID = ?`;
            params.unshift(userId); // Add userId before tourId
        }

        tourQuery += fromClause + ` WHERE t.TourID = ? AND t.Status = 'PUBLISHED'`;
        
        const [tourRows] = await db.query(tourQuery, params);
        
        if (tourRows.length === 0) return null;
        
        const tour = tourRows[0];
        tour.isFavorite = !!tour.isFavorite;

        // Lấy danh sách hình ảnh (Tour_Images)
        const imageQuery = `SELECT ImageURL FROM Tour_Images WHERE TourID = ?`;
        const [imageRows] = await db.query(imageQuery, [tourId]);
        tour.images = imageRows.map(img => img.ImageURL);

        return tour;
    }

    /**
     * Lấy danh sách Tour trong Wishlist của một User
     */
    static async getWishlist(userId) {
        const query = `
            SELECT t.TourID, t.Title, t.Slug, t.Price, t.Duration, t.AverageRating, t.ReviewCount, f.SavedAt
            FROM Tours t
            INNER JOIN User_Favorite_Tours f ON t.TourID = f.TourID
            WHERE f.UserID = ? AND t.Status = 'PUBLISHED'
            ORDER BY f.SavedAt DESC
        `;
        const [rows] = await db.query(query, [userId]);
        
        // Gắn thêm ảnh bìa cho hiển thị trên UI
        for (let tour of rows) {
            const [imgRows] = await db.query(`SELECT ImageURL FROM Tour_Images WHERE TourID = ? LIMIT 1`, [tour.TourID]);
            tour.images = imgRows.map(img => img.ImageURL);
        }
        
        return rows;
    }

    /**
     * Lưu / Bỏ lưu Tour yêu thích (Wishlist)
     */
    static async toggleFavorite(userId, tourId) {
        const checkQuery = `SELECT * FROM User_Favorite_Tours WHERE UserID = ? AND TourID = ?`;
        const [existing] = await db.query(checkQuery, [userId, tourId]);

        if (existing.length > 0) {
            await db.query(`DELETE FROM User_Favorite_Tours WHERE UserID = ? AND TourID = ?`, [userId, tourId]);
            return { action: 'removed' };
        } else {
            await db.query(`INSERT INTO User_Favorite_Tours (UserID, TourID) VALUES (?, ?)`, [userId, tourId]);
            return { action: 'added' };
        }
    }
}

module.exports = TourModel;
