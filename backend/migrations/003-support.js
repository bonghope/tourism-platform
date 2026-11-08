// Run with: node scripts/migrate-support.js
module.exports = async function migrateSupport(pool) {
  // Match existing ID column collations so foreign keys work on restored databases.
  const [[userColumn]] = await pool.query("SHOW FULL COLUMNS FROM Users LIKE 'UserID'");
  const [[bookingColumn]] = await pool.query("SHOW FULL COLUMNS FROM Bookings LIKE 'BookingID'");
  const idDefinition = column => {
    if (!/^varchar\(\d+\)$/i.test(column.Type) || !/^[a-z0-9_]+$/i.test(column.Collation)) throw Error('Unsupported ID schema');
    const charset = column.Collation.split('_')[0];
    return `${column.Type} CHARACTER SET ${charset} COLLATE ${column.Collation}`;
  };
  await pool.query(`CREATE TABLE IF NOT EXISTS Support_Conversations (
    ConversationID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    UserID ${idDefinition(userColumn)} NOT NULL,
    BookingID ${idDefinition(bookingColumn)} NULL,
    Subject VARCHAR(150) NOT NULL,
    Category ENUM('TOUR','PAYMENT','CANCELLATION','OTHER') NOT NULL DEFAULT 'OTHER',
    Status ENUM('OPEN','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'OPEN',
    CreatedAt DATETIME(3) NOT NULL,
    UpdatedAt DATETIME(3) NOT NULL,
    INDEX support_owner (UserID,UpdatedAt),
    INDEX support_status (Status,UpdatedAt),
    CONSTRAINT fk_support_user FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT fk_support_booking FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS Support_Messages (
    MessageID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    ConversationID CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    SenderID ${idDefinition(userColumn)} NOT NULL,
    SenderRole ENUM('USER','ADMIN') NOT NULL,
    Content TEXT NOT NULL,
    CreatedAt DATETIME(3) NOT NULL,
    ReadAt DATETIME(3) NULL,
    INDEX support_thread (ConversationID,CreatedAt,MessageID),
    INDEX support_unread (ConversationID,SenderRole,ReadAt),
    CONSTRAINT fk_support_message_thread FOREIGN KEY (ConversationID) REFERENCES Support_Conversations(ConversationID),
    CONSTRAINT fk_support_message_sender FOREIGN KEY (SenderID) REFERENCES Users(UserID)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};
