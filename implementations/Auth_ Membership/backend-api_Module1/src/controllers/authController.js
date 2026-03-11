const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Use our SQLite connection

// Create a new user account
exports.register = async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
        // Hash password and generate a unique member ID
        const hashedPassword = await bcrypt.hash(password, 10);
        const memberId = 'MEM' + Date.now().toString().slice(-6);

        // SQLite: Prepare and run the insertion synchronously
        const stmt = db.prepare('INSERT INTO Users (member_id, email, password, full_name) VALUES (?, ?, ?, ?)');
        const result = stmt.run(memberId, email, hashedPassword, full_name);

        res.status(201).json({ 
            success: true,
            memberId, 
            userId: result.lastInsertRowid 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Authenticate user and return session token
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // SQLite: Find user by email using .get()
        const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(email);
        
        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({ 
            success: true,
            token, 
            memberId: user.member_id, 
            userId: user.id, 
            full_name: user.full_name 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};