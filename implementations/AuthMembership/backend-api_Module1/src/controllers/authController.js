const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

const USERS  = `payment_svc."Users"`;
const TOKENS = `payment_svc."password_reset_tokens"`;

function getBaseUrl(req) {
    const proto = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    if (host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'))) {
        return `${proto}://${host}`;
    }
    if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');

    return `${proto}://${host}`;
}

function canExposeResetLink(req) {
    const host = req.hostname || '';
    const hasEmailProvider = process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || (process.env.SMTP_USER && process.env.SMTP_PASS);
    return !hasEmailProvider || host === 'localhost' || host === '127.0.0.1';
}

function parseEmailAddress(value, fallbackName = 'Bughair Fitness') {
    const sender = (value || '').trim();

    // Extract email from angle brackets without regex to avoid ReDoS
    const openAngle = sender.lastIndexOf('<');
    const closeAngle = sender.indexOf('>', openAngle >= 0 ? openAngle : 0);

    if (openAngle >= 0 && closeAngle > openAngle && closeAngle === sender.length - 1) {
        const email = sender.slice(openAngle + 1, closeAngle).trim();
        let name = sender.slice(0, openAngle).trim();
        // Strip surrounding quotes from display name
        if (name.length >= 2 && name.startsWith('"') && name.endsWith('"')) {
            name = name.slice(1, -1).trim();
        }
        return {
            name: name || fallbackName,
            email
        };
    }

    return {
        name: fallbackName,
        email: sender
    };
}

function buildPasswordResetEmail(user, resetLink) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #c8f53c; background: #0d0d0d; padding: 20px; text-align: center;">FITNESS - Password Reset</h2>
            <div style="padding: 20px; background: #f5f5f5;">
                <p>Hi <strong>${user.full_name}</strong>,</p>
                <p>You requested a password reset. Click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: #c8f53c; color: #0d0d0d; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 4px;">Reset Password</a>
                </div>
                <p style="color: #888; font-size: 0.85rem;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
        </div>
    `;
}

function logResetLink(reason, email, resetLink, token, expiresAt) {
    console.log(`\n=========================================`);
    console.log(`PASSWORD RESET LINK (${reason})`);
    console.log(`   User: ${email}`);
    console.log(`   Link: ${resetLink}`);
    console.log(`   Token: ${token}`);
    console.log(`   Expires: ${expiresAt}`);
    console.log(`=========================================\n`);
}

async function sendWithSendGrid(email, subject, html) {
    const sender = parseEmailAddress(process.env.SENDGRID_FROM);
    if (!sender.email) {
        throw new Error('SENDGRID_FROM is required when SENDGRID_API_KEY is configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email }] }],
                from: sender,
                subject,
                content: [{ type: 'text/html', value: html }]
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`SendGrid API error: HTTP ${response.status}${body ? ` ${body}` : ''}`);
        }

        console.log(`Password reset email sent to: ${email} via SendGrid`);
    } finally {
        clearTimeout(timeoutId);
    }
}

async function sendWithResend(email, subject, html) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM || 'Bughair Fitness <onboarding@resend.dev>',
                to: [email],
                subject,
                html
            }),
            signal: controller.signal
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (_) {
            payload = { message: await response.text().catch(() => '') };
        }

        if (!response.ok) {
            const message = payload.message || payload.name || `HTTP ${response.status}`;
            throw new Error(`Resend API error: ${message}`);
        }

        console.log(`Password reset email sent to: ${email} via Resend (${payload.id || 'no id'})`);
    } finally {
        clearTimeout(timeoutId);
    }
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
            profile_picture: user.profile_picture,
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
        const subject = 'Password Reset - Fitness Management System';
        const html = buildPasswordResetEmail(user, resetLink);

        // Try to send email, fallback to console log
        try {
            if (process.env.SENDGRID_API_KEY) {
                await sendWithSendGrid(email, subject, html);
            } else if (process.env.RESEND_API_KEY) {
                await sendWithResend(email, subject, html);
            } else {
            const nodemailer = require('nodemailer');
            const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: smtpPort,
                secure: smtpPort === 465,
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
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
                console.log(`Password reset email sent to: ${email} via SMTP`);
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

        const response = { success: true, message: 'If the email exists, a password reset link has been sent.' };
        if (canExposeResetLink(req)) {
            response.resetLink = resetLink;
        }
        res.json(response);
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
