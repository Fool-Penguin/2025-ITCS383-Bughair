const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

const USERS  = `payment_svc."Users"`;
const TOKENS = `payment_svc."password_reset_tokens"`;

function getBaseUrl(req) {
    if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');

    const proto = req.get('x-forwarded-proto') || req.protocol;
    return `${proto}://${req.get('host')}`;
}

// Register
exports.register = async (req, res) => {
    const { email, password, full_name, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const memberId = 'MEM' + Date.now().toString().slice(-6);
        const userRole = role || 'member';

        const r = await pool.query(
            `INSERT INTO ${USERS} (member_id, email, password, full_name, role)
             VALUES ($1,$2,$3,$4,$5) RETURNING id`,
            [memberId, email, hashedPassword, full_name, userRole]
        );

        res.status(201).json({
            success: true,
            memberId,
            userId: r.rows[0].id,
            role: userRole
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const r = await pool.query(`SELECT * FROM ${USERS} WHERE email = $1`, [email]);
        const user = r.rows[0];

        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({
            success: true,
            token,
            userId: user.id,
            memberId: user.member_id,
            full_name: user.full_name,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Profile (authenticated)
exports.getProfile = async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT id, member_id, email, full_name, phone, profile_picture, role, created_at
             FROM ${USERS} WHERE id = $1`,
            [req.user.id]
        );
        const user = r.rows[0];
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update Profile (authenticated)
exports.updateProfile = async (req, res) => {
    const { full_name, phone, profile_picture } = req.body;
    try {
        const cur = await pool.query(`SELECT * FROM ${USERS} WHERE id = $1`, [req.user.id]);
        const user = cur.rows[0];
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await pool.query(
            `UPDATE ${USERS} SET full_name = $1, phone = $2, profile_picture = $3 WHERE id = $4`,
            [
                full_name || user.full_name,
                phone !== undefined ? phone : user.phone,
                profile_picture !== undefined ? profile_picture : user.profile_picture,
                req.user.id
            ]
        );

        const updRes = await pool.query(
            `SELECT id, member_id, email, full_name, phone, profile_picture, role, created_at
             FROM ${USERS} WHERE id = $1`,
            [req.user.id]
        );
        res.json({ success: true, message: 'Profile updated successfully', data: updRes.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Forgot Password — generate reset token and send email (or log to console)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const userRes = await pool.query(`SELECT id, full_name FROM ${USERS} WHERE email = $1`, [email]);
        const user = userRes.rows[0];
        if (!user) {
            // Don't reveal if email exists or not (security best practice)
            return res.json({ success: true, message: 'If the email exists, a password reset link has been sent.' });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiry

        // Invalidate any existing tokens for this user
        await pool.query(`UPDATE ${TOKENS} SET used = 1 WHERE user_id = $1 AND used = 0`, [user.id]);

        // Store new token
        await pool.query(
            `INSERT INTO ${TOKENS} (user_id, token, expires_at) VALUES ($1,$2,$3::timestamptz)`,
            [user.id, token, expiresAt]
        );

        // Build reset link for the current deployment. APP_BASE_URL is best for Render.
        const resetLink = `${getBaseUrl(req)}/reset-password?token=${token}`;

        // Try to send email, fallback to console log
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || '"Fitness Center" <noreply@fitness.com>',
                    to: email,
                    subject: 'Password Reset — Fitness Management System',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #c8f53c; background: #0d0d0d; padding: 20px; text-align: center;">FITNESS — Password Reset</h2>
                            <div style="padding: 20px; background: #f5f5f5;">
                                <p>Hi <strong>${user.full_name}</strong>,</p>
                                <p>You requested a password reset. Click the button below to set a new password:</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${resetLink}" style="background: #c8f53c; color: #0d0d0d; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 4px;">Reset Password</a>
                                </div>
                                <p style="color: #888; font-size: 0.85rem;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
                            </div>
                        </div>
                    `
                });
                console.log(`Password reset email sent to: ${email}`);
            } else {
                // No SMTP configured — log to console
                console.log(`\n=========================================`);
                console.log(`PASSWORD RESET LINK (no email configured)`);
                console.log(`   User: ${email}`);
                console.log(`   Link: ${resetLink}`);
                console.log(`   Token: ${token}`);
                console.log(`   Expires: ${expiresAt}`);
                console.log(`=========================================\n`);
            }
        } catch (emailErr) {
            console.log(`\n=========================================`);
            console.log(`PASSWORD RESET LINK (email failed: ${emailErr.message})`);
            console.log(`   User: ${email}`);
            console.log(`   Link: ${resetLink}`);
            console.log(`   Token: ${token}`);
            console.log(`   Expires: ${expiresAt}`);
            console.log(`=========================================\n`);
        }

        res.json({ success: true, message: 'If the email exists, a password reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Reset Password — validate token and update password
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    const client = await pool.connect();
    try {
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const tokenRes = await client.query(
            `SELECT * FROM ${TOKENS} WHERE token = $1 AND used = 0`,
            [token]
        );
        const resetToken = tokenRes.rows[0];

        if (!resetToken) {
            return res.status(400).json({ success: false, message: 'Invalid or already used reset token' });
        }

        if (new Date(resetToken.expires_at) < new Date()) {
            await client.query(`UPDATE ${TOKENS} SET used = 1 WHERE id = $1`, [resetToken.id]);
            return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await client.query('BEGIN');
        await client.query(`UPDATE ${USERS} SET password = $1 WHERE id = $2`, [hashedPassword, resetToken.user_id]);
        await client.query(`UPDATE ${TOKENS} SET used = 1 WHERE id = $1`, [resetToken.id]);
        await client.query('COMMIT');

        console.log(`Password reset successful for user ID: ${resetToken.user_id}`);
        res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};
