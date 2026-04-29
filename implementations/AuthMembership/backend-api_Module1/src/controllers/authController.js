const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

// Register
exports.register = async (req, res) => {
    const { email, password, full_name, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const memberId = 'MEM' + Date.now().toString().slice(-6);
        const userRole = role || 'member';

        const stmt = db.prepare('INSERT INTO Users (member_id, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(memberId, email, hashedPassword, full_name, userRole);

        res.status(201).json({ 
            success: true, 
            memberId, 
            userId: result.lastInsertRowid,
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
            role: user.role 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Profile (authenticated)
exports.getProfile = (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, member_id, email, full_name, phone, profile_picture, role, created_at FROM Users WHERE id = ?');
        const user = stmt.get(req.user.id);
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
        const user = db.prepare('SELECT * FROM Users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        db.prepare(
            'UPDATE Users SET full_name = ?, phone = ?, profile_picture = ? WHERE id = ?'
        ).run(
            full_name || user.full_name,
            phone !== undefined ? phone : user.phone,
            profile_picture !== undefined ? profile_picture : user.profile_picture,
            req.user.id
        );

        // Return updated user data
        const updated = db.prepare('SELECT id, member_id, email, full_name, phone, profile_picture, role, created_at FROM Users WHERE id = ?').get(req.user.id);
        res.json({ success: true, message: 'Profile updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Forgot Password — generate reset token and send email (or log to console)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(email);
        if (!user) {
            // Don't reveal if email exists or not (security best practice)
            return res.json({ success: true, message: 'If the email exists, a password reset link has been sent.' });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiry

        // Invalidate any existing tokens for this user
        db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

        // Store new token
        db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

        // Build reset link
        const resetLink = `http://localhost:8080/reset-password.html?token=${token}`;

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
                console.log(`📧 Password reset email sent to: ${email}`);
            } else {
                // No SMTP configured — log to console
                console.log(`\n=========================================`);
                console.log(`🔑 PASSWORD RESET LINK (no email configured)`);
                console.log(`   User: ${email}`);
                console.log(`   Link: ${resetLink}`);
                console.log(`   Token: ${token}`);
                console.log(`   Expires: ${expiresAt}`);
                console.log(`=========================================\n`);
            }
        } catch (emailErr) {
            // Email failed — log to console as fallback
            console.log(`\n=========================================`);
            console.log(`🔑 PASSWORD RESET LINK (email failed: ${emailErr.message})`);
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
    try {
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Find valid token
        const resetToken = db.prepare(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0'
        ).get(token);

        if (!resetToken) {
            return res.status(400).json({ success: false, message: 'Invalid or already used reset token' });
        }

        // Check expiry
        if (new Date(resetToken.expires_at) < new Date()) {
            db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);
            return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const update = db.transaction(() => {
            db.prepare('UPDATE Users SET password = ? WHERE id = ?').run(hashedPassword, resetToken.user_id);
            db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);
        });
        update();

        console.log(`✅ Password reset successful for user ID: ${resetToken.user_id}`);
        res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};