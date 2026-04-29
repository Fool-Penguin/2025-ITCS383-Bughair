const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dbDir, 'auth_membership.db');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function ensureColumn(tableName, columnName, definition) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    if (!columns.some((column) => column.name === columnName)) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
    }
}

function initializeDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            profile_image TEXT,
            role TEXT DEFAULT 'member',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS Memberships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan_id TEXT NOT NULL,
            start_date TEXT DEFAULT (datetime('now')),
            expiry_date TEXT,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (user_id) REFERENCES Users(id)
        );

        CREATE TABLE IF NOT EXISTS membership_plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('FREE','PAID')),
            billing TEXT CHECK(billing IN ('MONTHLY','YEARLY')),
            price REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'THB',
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        );
    `);

    ensureColumn('Users', 'phone', 'phone TEXT');
    ensureColumn('Users', 'profile_image', 'profile_image TEXT');

    const existing = db.prepare('SELECT COUNT(*) as count FROM membership_plans').get();
    if (existing.count === 0) {
        const insertPlan = db.prepare(`
            INSERT INTO membership_plans (id, name, type, billing, price, currency, description)
            VALUES (?, ?, ?, ?, ?, 'THB', ?)
        `);

        insertPlan.run('plan_free', 'Free Membership', 'FREE', null, 0, 'Basic access with limited features');
        insertPlan.run('plan_monthly', 'Monthly Membership', 'PAID', 'MONTHLY', 499, 'Full access, billed monthly');
        insertPlan.run('plan_yearly', 'Yearly Membership', 'PAID', 'YEARLY', 4999, 'Full access, billed yearly (save 17%)');
    }
}

initializeDatabase();

module.exports = db;
module.exports.initializeDatabase = initializeDatabase;