require('dotenv').config({quiet:true});
const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../config/database');
async function migrate() {
 const connection = await pool.getConnection();
 try {
  const [columns] = await connection.query("SELECT COLUMN_NAME, COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Tours'");
  if (!columns.some(c=>c.COLUMN_NAME==='StartDate')) { console.log('Migration already applied.'); return; }
  const [tours] = await connection.query('SELECT * FROM Tours');
  const [bookings] = await connection.query('SELECT * FROM Bookings');
  const backupDir = path.join(__dirname,'../backups');await fs.mkdir(backupDir,{recursive:true});
  const backupPath = path.join(backupDir,'departures-'+Date.now()+'.json');
  const [tourSchema]=await connection.query('SHOW CREATE TABLE Tours');const [bookingSchema]=await connection.query('SHOW CREATE TABLE Bookings');
  await fs.writeFile(backupPath,JSON.stringify({tourSchema,bookingSchema,tours,bookings},null,2),{flag:'wx'});
  console.log('Saved database snapshot in backend/backups (not tracked in Git).');
  const collation = columns.find(c=>c.COLUMN_NAME==='TourID').COLLATION_NAME;
  if (!/^[a-zA-Z0-9_]+$/.test(collation)) throw Error('Unsupported database collation');
  const charset = collation.split('_')[0];
  await connection.query(`CREATE TABLE IF NOT EXISTS TourDepartures (
   DepartureID VARCHAR(36) CHARACTER SET ${charset} COLLATE ${collation} NOT NULL PRIMARY KEY,
   TourID VARCHAR(36) CHARACTER SET ${charset} COLLATE ${collation} NOT NULL,
   StartDate DATETIME NOT NULL, EndDate DATETIME NULL,
   MaxSlots INT NOT NULL, AvailableSlots INT NOT NULL,
   Status ENUM('OPEN','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
   CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   UNIQUE KEY departure_tour (DepartureID,TourID), KEY tour_date (TourID,Status,StartDate),
   CONSTRAINT departures_tour_fk FOREIGN KEY (TourID) REFERENCES Tours(TourID),
   CHECK (MaxSlots > 0), CHECK (AvailableSlots >= 0 AND AvailableSlots <= MaxSlots),
   CHECK (EndDate IS NULL OR EndDate > StartDate)
  )`);
  const [bookingColumns]=await connection.query("SHOW COLUMNS FROM Bookings LIKE 'DepartureID'");
  if (!bookingColumns.length) await connection.query(`ALTER TABLE Bookings ADD COLUMN DepartureID VARCHAR(36) CHARACTER SET ${charset} COLLATE ${collation} NULL`);
  await connection.beginTransaction();
  // Legacy tour dates were entered as Vietnam local time; new departure dates are UTC.
  await connection.query(`INSERT IGNORE INTO TourDepartures (DepartureID,TourID,StartDate,EndDate,MaxSlots,AvailableSlots,Status)
   SELECT TourID,TourID,CONVERT_TZ(StartDate,'+07:00','+00:00'),
    CASE WHEN EndDate > StartDate THEN CONVERT_TZ(EndDate,'+07:00','+00:00') ELSE NULL END,
    MaxSlots,AvailableSlots,
    CASE WHEN EndDate > StartDate AND StartDate > DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR) THEN 'OPEN' ELSE 'CLOSED' END
   FROM Tours`);
  await connection.query('UPDATE Bookings SET DepartureID = TourID WHERE DepartureID IS NULL');
  const [invalid]=await connection.query('SELECT COUNT(*) AS count FROM Bookings b LEFT JOIN TourDepartures d ON b.DepartureID=d.DepartureID AND b.TourID=d.TourID WHERE d.DepartureID IS NULL');
  if (invalid[0].count) throw Error('Some bookings could not be linked to a departure');
  await connection.commit();
  const [keys]=await connection.query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Bookings' AND CONSTRAINT_NAME='bookings_departure_fk'");
  if (!keys.length) await connection.query('ALTER TABLE Bookings ADD CONSTRAINT bookings_departure_fk FOREIGN KEY (DepartureID,TourID) REFERENCES TourDepartures(DepartureID,TourID)');
  await connection.query(`ALTER TABLE Bookings MODIFY DepartureID VARCHAR(36) CHARACTER SET ${charset} COLLATE ${collation} NOT NULL`);
  const [checks]=await connection.query("SELECT tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc ON tc.CONSTRAINT_SCHEMA=cc.CONSTRAINT_SCHEMA AND tc.CONSTRAINT_NAME=cc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA=DATABASE() AND tc.TABLE_NAME='Tours' AND tc.CONSTRAINT_TYPE='CHECK'");
  for(const check of checks.filter(c=>/MaxSlots|AvailableSlots/.test(c.CHECK_CLAUSE))) await connection.query('ALTER TABLE Tours DROP CHECK `'+check.CONSTRAINT_NAME.replace(/`/g,'``')+'`');
  await connection.query('ALTER TABLE Tours DROP COLUMN StartDate, DROP COLUMN EndDate, DROP COLUMN MaxSlots, DROP COLUMN AvailableSlots');
  console.log(`Migration complete: ${tours.length} legacy departures; ${bookings.length} bookings preserved.`);
 } catch(error) { await connection.rollback(); throw error; }
 finally { connection.release(); await pool.end(); }
}
migrate().catch(error=>{console.error('Migration failed:',error.code||error.message);process.exitCode=1;});
