require('dotenv').config({ quiet: true });
const pool = require('../config/database');
(async () => {
  try { await require('../migrations/001-tour-dates-rating-jobs')(pool); console.log('Migration hoàn tất.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await pool.end(); }
})();
