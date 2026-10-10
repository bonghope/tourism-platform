const { syncRating } = require('../utils/tourRatings');
async function processRatingJobs(pool, logger = console) {
  const [jobs] = await pool.query('SELECT TourID FROM Tour_Rating_Jobs ORDER BY UpdatedAt LIMIT 50');
  for (const job of jobs) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      // Same lock order as review writers prevents lost updates and deadlocks.
      await connection.query('SELECT TourID FROM Tours WHERE TourID = ? FOR UPDATE', [job.TourID]);
      const [pending] = await connection.query('SELECT TourID FROM Tour_Rating_Jobs WHERE TourID = ? FOR UPDATE', [job.TourID]);
      if (pending.length) {
        await syncRating(connection, job.TourID);
        await connection.query('DELETE FROM Tour_Rating_Jobs WHERE TourID = ?', [job.TourID]);
      }
      await connection.commit();
    } catch (error) {
      if (connection) await connection.rollback();
      logger.error('[Rating worker]', error.message);
    } finally { if (connection) connection.release(); }
  }
}
function startRatingWorker(pool) {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try { await processRatingJobs(pool); }
    catch (error) { console.error('[Rating worker]', error.message); }
    finally { running = false; }
  };
  const timer = setInterval(run, 10000);
  timer.unref();
  run();
  return timer;
}
module.exports = { processRatingJobs, startRatingWorker };
