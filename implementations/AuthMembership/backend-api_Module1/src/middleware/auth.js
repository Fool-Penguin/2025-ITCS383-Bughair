const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'fitness_secret_key');
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = { authenticate };