require('dotenv').config({quiet:true});
const pool=require('../config/database');
(async()=>{try{const [columns]=await pool.query("SHOW COLUMNS FROM Users LIKE 'GoogleID'");if(!columns.length)await pool.query('ALTER TABLE Users ADD COLUMN GoogleID VARCHAR(255) NULL UNIQUE');console.log('GoogleID schema ready.');}catch(e){console.error(e.message);process.exitCode=1;}finally{await pool.end();}})();
