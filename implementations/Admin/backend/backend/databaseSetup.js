const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to your databases folder
const dbDir = path.join(__dirname, 'databases');

// Check if folder exists, if not, create it
if (!fs.existsSync(dbDir)) {
    console.log("📁 Creating databases folder...");
    fs.mkdirSync(dbDir);
}

// --- CREATE AUDIT DATABASE ---
const auditDbPath = path.join(dbDir, 'admin_audit.db');
const dbAudit = new sqlite3.Database(auditDbPath, (err) => {
    if (err) {
        console.error("❌ Failed to connect to Audit DB:", err.message);
    } else {
        console.log("🔌 Connected to admin_audit.db");
    }
});

dbAudit.serialize(() => {
    dbAudit.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id TEXT,
        action TEXT,
        target_user TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error("❌ Error creating audit table:", err.message);
        } else {
            console.log("✅ Audit table is ready in admin_audit.db");
        }
    });
});

dbAudit.close(() => {
    console.log("🔒 Database connection closed.");
});