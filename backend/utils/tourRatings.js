// Only reviews visible to customers contribute to displayed tour ratings.
function ratingColumns(tourAlias = 't') {
  return `(SELECT COUNT(*) FROM Reviews rating_reviews WHERE rating_reviews.TourID = ${tourAlias}.TourID AND rating_reviews.Status = 'PUBLISHED') AS ReviewCount,
          COALESCE((SELECT AVG(Rating) FROM Reviews rating_reviews WHERE rating_reviews.TourID = ${tourAlias}.TourID AND rating_reviews.Status = 'PUBLISHED'), 0) AS AverageRating`;
}
async function syncRating(connection, tourId) {
  await connection.query(`UPDATE Tours SET
    AverageRating = COALESCE((SELECT AVG(Rating) FROM Reviews WHERE TourID = ? AND Status = 'PUBLISHED'), 0),
    TotalRatingPts = COALESCE((SELECT SUM(Rating) FROM Reviews WHERE TourID = ? AND Status = 'PUBLISHED'), 0),
    ReviewCount = (SELECT COUNT(*) FROM Reviews WHERE TourID = ? AND Status = 'PUBLISHED')
    WHERE TourID = ?`, [tourId, tourId, tourId, tourId]);
}
module.exports = { ratingColumns, syncRating };
