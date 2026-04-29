const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const nodemailer = require('nodemailer');

function mapUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        memberId: user.member_id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || '',
        profile_image: user.profile_image || '',
        role: user.role,
        created_at: user.created_at,
    };
}

function createResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Register
exports.register = async (req, res) => {
    const { email, password, full_name, phone, profile_image, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const memberId = 'MEM' + Date.now().toString().slice(-6);
        const userRole = role || 'member';

        const stmt = db.prepare('INSERT INTO Users (member_id, email, password, full_name, phone, profile_image, role) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const result = stmt.run(memberId, email, hashedPassword, full_name, phone || null, profile_image || null, userRole);

        res.status(201).json({ 
            success: true, 
            memberId, 
            userId: result.lastInsertRowid,
            role: userRole,
            phone: phone || '',
            profile_image: profile_image || ''
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(email);
        
        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        // ✅ ส่งข้อมูลกลับไปให้ครบเพื่อให้ Frontend เก็บลง localStorage ได้ถูกต้อง
        res.json({ 
            success: true,
            token,
            userId: user.id,
            memberId: user.member_id,
            full_name: user.full_name,
            phone: user.phone || '',
            profile_image: user.profile_image || '',
            role: user.role 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getMe = (req, res) => {
    try {
        const user = db.prepare('SELECT id, member_id, email, full_name, phone, profile_image, role, created_at FROM Users WHERE id = ?').get(req.user.id);
        res.json({ success: true, data: mapUser(user) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone, profile_image } = req.body;
        const current = db.prepare('SELECT * FROM Users WHERE id = ?').get(req.user.id);
        if (!current) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        db.prepare(`
            UPDATE Users
            SET full_name = ?, phone = ?, profile_image = ?
            WHERE id = ?
        `).run(
            full_name || current.full_name,
            phone ?? current.phone,
            profile_image ?? current.profile_image,
            req.user.id
        );

        const updated = db.prepare('SELECT id, member_id, email, full_name, phone, profile_image, role, created_at FROM Users WHERE id = ?').get(req.user.id);
        res.json({ success: true, message: 'Profile updated', data: mapUser(updated) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = db.prepare('SELECT id, email FROM Users WHERE email = ?').get(email);
        if (!user) {
            return res.json({ success: true, message: 'If the email exists, a reset link has been generated.' });
        }

        const rawToken = createResetToken();
        const tokenHash = hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL').run(user.id);
        db.prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(user.id, tokenHash, expiresAt);

        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        const resetLink = `${baseUrl}/auth.html?resetToken=${rawToken}&email=${encodeURIComponent(email)}`;

        // Attempt to send email. Use SMTP if configured, otherwise create an Ethereal test account for dev.
        let previewUrl = null;
        try {
            let transporter;
            if (process.env.SMTP_HOST && process.env.SMTP_USER) {
                transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
            } else {
                const testAccount = await nodemailer.createTestAccount();
                transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    auth: { user: testAccount.user, pass: testAccount.pass }
                });
            }

            const info = await transporter.sendMail({
                from: process.env.FROM_EMAIL || 'no-reply@example.com',
                to: email,
                subject: 'Password reset request',
                text: `Use the following link to reset your password: ${resetLink}`,
                html: `<p>Click to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
            });

            // If using Ethereal, get preview URL for developer convenience
            previewUrl = nodemailer.getTestMessageUrl(info) || null;
        } catch (mailErr) {
            // Don't fail the whole request if mail sending fails; return reset link for dev.
            console.warn('Failed to send reset email:', mailErr.message || mailErr);
        }

        const response = { success: true, message: 'Password reset link generated' };
        if (previewUrl) response.previewUrl = previewUrl;
        // Include resetLink in response only in dev (or when SMTP not configured)
        if (!process.env.SMTP_HOST) response.resetLink = resetLink;

        res.json(response);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, token, and new password are required' });
        }

        const user = db.prepare('SELECT id FROM Users WHERE email = ?').get(email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Reset token is invalid or expired' });
        }

        const tokenHash = hashResetToken(token);
        const row = db.prepare(`
            SELECT *
            FROM password_reset_tokens
            WHERE user_id = ? AND token_hash = ? AND used_at IS NULL
            ORDER BY id DESC LIMIT 1
        `).get(user.id, tokenHash);

        if (!row || new Date(row.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE Users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
        db.prepare('UPDATE password_reset_tokens SET used_at = datetime(\'now\') WHERE id = ?').run(row.id);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};