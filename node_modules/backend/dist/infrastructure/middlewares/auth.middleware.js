"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jwt_1 = require("../security/jwt");
const error_middleware_1 = require("./error.middleware");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new error_middleware_1.AppError('Unauthorized: No token provided', 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        return next();
    }
    catch (error) {
        return next(new error_middleware_1.AppError('Unauthorized: Invalid or expired token', 401));
    }
};
exports.requireAuth = requireAuth;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.AppError('Unauthorized: Access denied', 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new error_middleware_1.AppError('Forbidden: Insufficient permissions', 403));
        }
        return next();
    };
};
exports.requireRole = requireRole;
