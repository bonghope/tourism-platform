// Next departure shown on tour cards; booking always sends an explicit DepartureID.
function departureColumns(alias = 't') {
  const next = `FROM TourDepartures d WHERE d.TourID = ${alias}.TourID AND d.Status = 'OPEN' AND d.StartDate > UTC_TIMESTAMP() AND d.AvailableSlots > 0 ORDER BY d.StartDate, d.DepartureID LIMIT 1`;
  return `(SELECT d.DepartureID ${next}) AS DepartureID,
    (SELECT DATE_FORMAT(d.StartDate, '%Y-%m-%dT%H:%i:%sZ') ${next}) AS StartDate,
    (SELECT DATE_FORMAT(d.EndDate, '%Y-%m-%dT%H:%i:%sZ') ${next}) AS EndDate,
    COALESCE((SELECT d.MaxSlots ${next}), 0) AS MaxSlots,
    COALESCE((SELECT d.AvailableSlots ${next}), 0) AS AvailableSlots`;
}
module.exports = { departureColumns };
