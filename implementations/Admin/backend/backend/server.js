const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE PATHS ---
const paths = {
    promo: path.join(__dirname, 'databases', 'promotion.db'),
    course: path.join(__dirname, 'databases', 'course.db'),
    audit: path.join(__dirname, 'databases', 'admin_audit.db'),
    // Paths to teammates' databases (Adjust '..' counts if needed)
    member: path.join(__dirname, '..', '..', '..', '..', 'Auth_Membership', 'members.db'),
    payment: path.join(__dirname, '..', '..', '..', '..', 'payment-service', 'data', 'fitness_payment.db'),
    attendance: path.join(__dirname, '..', '..', '..', '..', 'attendance-service', 'attendance.db')
};

// --- HELPER FUNCTIONS ---

function runQuery(dbPath, query) {
    return new Promise((resolve) => {
        if (!fs.existsSync(dbPath)) {
            console.log(`⚠️ Missing file: ${dbPath}`);
            return resolve(0);
        }
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return resolve(0);
        });
        db.get(query, (err, row) => {
            db.close();
            if (err || !row) resolve(0);
            else resolve(row.count || row.total || 0);
        });
    });
}

function logAdminActivity(action, target, details) {
    if (!fs.existsSync(paths.audit)) return;
    const db = new sqlite3.Database(paths.audit);
    db.run(`INSERT INTO audit_logs (admin_id, action, target_user, details) VALUES (?, ?, ?, ?)`, 
    ['Phruek_Admin', action, target, details]);
    db.close();
}

// --- API ROUTES ---

// 1. DASHBOARD STATS
app.get('/api/dashboard/stats', async (req, res) => {
    const stats = {
        revenue: await runQuery(paths.payment, `SELECT SUM(amount) as total FROM payment_transactions`),
        activeMembers: await runQuery(paths.member, `SELECT COUNT(*) as count FROM Users`), 
        attendanceToday: await runQuery(paths.attendance, `SELECT COUNT(*) as count FROM attendance WHERE date = CURRENT_DATE`),
        activePromos: await runQuery(paths.promo, `SELECT COUNT(*) as count FROM promotions`)
    };
    res.json(stats);
});

// 2. PROMOTIONS (CRUD)
app.get('/api/promotions', (req, res) => {
    const db = new sqlite3.Database(paths.promo);
    db.all(`SELECT * FROM promotions`, [], (err, rows) => {
        db.close();
        res.json(rows || []);
    });
});

app.post('/api/promotions', (req, res) => {
    const { promo_code, promo_name, discount_amount, discount_type, expiry_date, usage_limit } = req.body;
    const db = new sqlite3.Database(paths.promo);
    const query = `INSERT INTO promotions (promo_code, promo_name, discount_amount, discount_type, expiry_date, usage_limit, status) 
                   VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`;
    db.run(query, [promo_code, promo_name, discount_amount, discount_type, expiry_date, usage_limit], function(err) {
        db.close();
        if (err) return res.status(500).json({ error: err.message });
        logAdminActivity('CREATE_PROMO', promo_code, `Name: ${promo_name}`);
        res.json({ id: this.lastID });
    });
});

app.delete('/api/promotions/:id', (req, res) => {
    const { id } = req.params;
    const db = new sqlite3.Database(paths.promo);
    db.get(`SELECT promo_code FROM promotions WHERE id = ?`, [id], (err, row) => {
        const promoCode = row ? row.promo_code : 'Unknown';
        db.run(`DELETE FROM promotions WHERE id = ?`, [id], function(err) {
            db.close();
            logAdminActivity('DELETE_PROMO', promoCode, `Deleted promo ID: ${id}`);
            res.json({ success: true });
        });
    });
});

// 3. COURSES (CRUD)
app.get('/api/courses', (req, res) => {
    const db = new sqlite3.Database(paths.course);
    db.all(`SELECT * FROM courses`, [], (err, rows) => {
        db.close();
        res.json(rows || []);
    });
});

app.post('/api/courses', (req, res) => {
    const { course_name, instructor, schedule, max_attendees, course_type, fitness_level } = req.body;
    const db = new sqlite3.Database(paths.course);
    const query = `INSERT INTO courses (course_name, instructor, schedule, max_attendees, course_type, fitness_level) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [course_name, instructor, schedule, max_attendees, course_type, fitness_level], function(err) {
        db.close();
        logAdminActivity('CREATE_COURSE', course_name, 'Created new course');
        res.json({ id: this.lastID });
    });
});

app.patch('/api/courses/:id/status', (req, res) => {
    const { status } = req.body;
    const db = new sqlite3.Database(paths.course);
    db.run(`UPDATE courses SET status = ? WHERE id = ?`, [status, req.params.id], () => {
        db.close();
        logAdminActivity('COURSE_STATUS', req.params.id, `Status updated to ${status}`);
        res.json({ success: true });
    });
});

app.delete('/api/courses/:id', (req, res) => {
    const { reason } = req.body;
    const db = new sqlite3.Database(paths.course);
    db.run(`DELETE FROM courses WHERE id = ?`, [req.params.id], () => {
        db.close();
        logAdminActivity('DELETE_COURSE', req.params.id, `Reason: ${reason}`);
        res.json({ success: true });
    });
});

// 4. CUSTOMER MANAGEMENT (Admin Control)
app.get('/api/admin/customers', (req, res) => {
    const db = new sqlite3.Database(paths.member);
    db.all(`SELECT id, actor_id, actor_role, status FROM Users`, [], (err, rows) => {
        db.close();
        res.json(rows || []);
    });
});

app.patch('/api/admin/customers/:id/status', (req, res) => {
    const { status, actor_id } = req.body;
    const db = new sqlite3.Database(paths.member);
    db.run(`UPDATE Users SET status = ? WHERE id = ?`, [status, req.params.id], () => {
        db.close();
        logAdminActivity('USER_STATUS_CHANGE', actor_id, `Status set to ${status}`);
        res.json({ success: true });
    });
});

// 5. AUDIT LOGS
app.get('/api/admin/audit', (req, res) => {
    const db = new sqlite3.Database(paths.audit);
    db.all(`SELECT * FROM audit_logs ORDER BY timestamp DESC`, [], (err, rows) => {
        db.close();
        res.json(rows || []);
    });
});

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Admin Service running on http://localhost:${PORT}`));