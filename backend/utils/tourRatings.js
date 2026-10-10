// Only reviews visible to customers contribute to displayed tour ratings.
function ratingColumns(tourAlias = 't') {
  return `${tourAlias}.ReviewCount, ${tourAlias}.AverageRating`;
}
async function enqueueRating(connection, tourId) {
  await connection.query(`INSERT INTO Tour_Rating_Jobs (TourID) VALUES (?)
    ON DUPLICATE KEY UPDATE UpdatedAt = CURRENT_TIMESTAMP`, [tourId]);
}
async function syncRating(connection, tourId) {
  const [rows] = await connection.query(`SELECT COALESCE(SUM(Rating), 0) AS points, COUNT(*) AS count
    FROM Reviews WHERE TourID = ? AND Status = 'PUBLISHED'`, [tourId]);
  const points = Number(rows[0].points), count = Number(rows[0].count);
  await connection.query(`UPDATE Tours SET TotalRatingPts = ?, ReviewCount = ?, AverageRating = ? WHERE TourID = ?`,
    [points, count, count ? points / count : 0, tourId]);
}
module.exports = { ratingColumns, syncRating, enqueueRating };
