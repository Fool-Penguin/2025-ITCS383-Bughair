// Handle membership plans and status tracking
const pool = require('../config/db');

const MEMBERSHIPS = `payment_svc."Memberships"`;
const PLANS       = `payment_svc."membership_plans"`;
const USERS       = `payment_svc."Users"`;

// POST /membership/subscribe - Register a user to a membership plan
exports.subscribe = async (req, res) => {
    const { userId, planId } = req.body;
    try {
        // Calculate expiry date based on plan
        const days = (planId === 2 || planId === 'plan_monthly') ? 30 :
                     (planId === 3 || planId === 'plan_yearly')  ? 365 : 9999;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        const expiryString = expiryDate.toISOString();

        await pool.query(
            `INSERT INTO ${MEMBERSHIPS} (user_id, plan_id, start_date, expiry_date, status)
             VALUES ($1, $2, NOW(), $3::timestamptz, 'active')`,
            [userId, planId, expiryString]
        );

        res.json({ success: true, message: "Subscription successful!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /membership/status - Check current membership and expiry
exports.getStatus = async (req, res) => {
    const { userId } = req.query;
    try {
        const r = await pool.query(
            `SELECT m.*, p.name AS plan_name
             FROM ${MEMBERSHIPS} m
             JOIN ${PLANS} p ON m.plan_id = p.id
             WHERE m.user_id = $1
             ORDER BY m.id DESC LIMIT 1`,
            [userId]
        );
        res.json({ success: true, data: r.rows[0] || { message: "No active membership found" } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /profile - Retrieve user profile data
exports.getProfile = async (req, res) => {
    const { userId } = req.query;
    try {
        const r = await pool.query(
            `SELECT member_id, email, full_name FROM ${USERS} WHERE id = $1`,
            [userId]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
