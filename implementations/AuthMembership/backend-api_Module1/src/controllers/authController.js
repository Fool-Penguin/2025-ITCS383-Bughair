const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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