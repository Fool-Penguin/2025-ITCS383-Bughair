const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../payment-service/data/fitness_payment.db');
console.log('DB:', dbPath);

const db = new Database(dbPath);

// Check current columns
const cols = db.pragma('table_info(Users)').map(c => c.name);
console.log('Current Users columns:', cols);

// Add missing columns
if (!cols.includes('phone')) {
  db.exec('ALTER TABLE Users ADD COLUMN phone TEXT');
  console.log('✅ Added phone column');
}
if (!cols.includes('profile_picture')) {
  db.exec('ALTER TABLE Users ADD COLUMN profile_picture TEXT');
  console.log('✅ Added profile_picture column');
}

// Create password_reset_tokens table
db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
  )
`);
console.log('✅ password_reset_tokens table ready');

// Verify
console.log('Final Users columns:', db.pragma('table_info(Users)').map(c => c.name));
console.log('password_reset_tokens columns:', db.pragma('table_info(password_reset_tokens)').map(c => c.name));

db.close();
console.log('Done!');
