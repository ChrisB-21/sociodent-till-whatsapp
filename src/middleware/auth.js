const jwtService = require('../config/jwt');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization header format'
            });
        }

        const decoded = await jwtService.verifyToken(token);
        
        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.userRole
        };

        next();
    } catch (error) {
        if (error.message === 'Token is blacklisted') {
            return res.status(401).json({
                success: false,
                message: 'Token has been invalidated',
                code: 'TOKEN_BLACKLISTED'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access forbidden'
            });
        }

        next();
    };
};

module.exports = {
    auth,
    authorize
};