require('dotenv').config({quiet:true});
const pool=require('../config/database');
(async()=>{try{await require('../migrations/003-support')(pool);console.log('Support tables ready.');}catch(e){console.error(e.code||e.message);process.exitCode=1;}finally{await pool.end();}})();
