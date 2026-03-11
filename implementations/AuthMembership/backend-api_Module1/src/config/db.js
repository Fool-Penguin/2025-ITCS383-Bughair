const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ✅ FIXED: Path from src/config -> src -> backend -> Auth_Membership -> payment-service -> data
const dbDir = path.resolve(__dirname, '../../../../payment-service/data');
const dbPath = path.join(dbDir, 'fitness_payment.db');

// English Comment: Ensure the shared data directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;