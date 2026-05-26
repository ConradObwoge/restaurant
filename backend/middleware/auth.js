const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access denied. No token provided.' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Token expired. Please login again.' 
            });
        }
        return res.status(403).json({ 
            success: false, 
            error: 'Invalid token.' 
        });
    }
}

function authorizeAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            error: 'Admin access required.' 
        });
    }
    next();
}

function authorizeStaff(req, res, next) {
    if (!['admin', 'staff'].includes(req.user.role)) {
        return res.status(403).json({ 
            success: false, 
            error: 'Staff access required.' 
        });
    }
    next();
}

module.exports = { authenticateToken, authorizeAdmin, authorizeStaff };