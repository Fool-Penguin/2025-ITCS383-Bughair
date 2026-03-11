// Handle membership plans and status tracking
const db = require('../config/db');

// POST /membership/subscribe - Register a user to a membership plan
exports.subscribe = async (req, res) => {
    const { userId, planId } = req.body;
    try {
        // Calculate expiry date based on plan: 2=Monthly(30 days), 3=Yearly(365 days)
        let days = (planId === 2 || planId === 'plan_monthly') ? 30 : 
                   (planId === 3 || planId === 'plan_yearly') ? 365 : 9999;
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        const expiryString = expiryDate.toISOString();

        // SQLite: Use prepare().run() and datetime('now') instead of execute() and NOW()
        const stmt = db.prepare(`
            INSERT INTO Memberships (user_id, plan_id, start_date, expiry_date, status) 
            VALUES (?, ?, datetime('now'), ?, 'active')
        `);
        stmt.run(userId, planId, expiryString);

        res.json({ success: true, message: "Subscription successful!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /membership/status - Check current membership and expiry
exports.getStatus = (req, res) => {
    const { userId } = req.query;
    try {
        // SQLite: Join with friend's table name 'membership_plans' (all lowercase)
        const stmt = db.prepare(`
            SELECT m.*, p.name as plan_name 
            FROM Memberships m 
            JOIN membership_plans p ON m.plan_id = p.id 
            WHERE m.user_id = ? 
            ORDER BY m.id DESC LIMIT 1
        `);
        const row = stmt.get(userId);
        
        res.json({ success: true, data: row || { message: "No active membership found" } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /profile - Retrieve user profile data
exports.getProfile = (req, res) => {
    const { userId } = req.query;
    try {
        const stmt = db.prepare('SELECT member_id, email, full_name FROM Users WHERE id = ?');
        const user = stmt.get(userId);
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};