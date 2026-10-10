module.exports = async function migrate(pool) {
  for (const [table, column, definition] of [['Tours', 'EndDate', 'DATETIME NULL'], ['Users', 'LockedUntil', 'DATETIME NULL'], ['Tours', 'OriginalPrice', 'DECIMAL(12,2) NULL'], ['Tours', 'DiscountPercent', 'DECIMAL(5,2) NOT NULL DEFAULT 0']]) {
    if (table === 'Tours' && column === 'EndDate') {
      const [legacyDates] = await pool.query("SHOW COLUMNS FROM Tours LIKE 'StartDate'");
      if (!legacyDates.length) continue;
    }
    const [columns] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
    if (!columns.length) await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS Tour_Rating_Jobs (
    TourID VARCHAR(36) PRIMARY KEY, UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rating_job_tour FOREIGN KEY (TourID) REFERENCES Tours(TourID)
  ) ENGINE=InnoDB`);
  await pool.query(`INSERT IGNORE INTO Tour_Rating_Jobs (TourID) SELECT TourID FROM Tours`);
};
