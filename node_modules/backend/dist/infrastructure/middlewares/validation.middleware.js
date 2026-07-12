"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const error_middleware_1 = require("./error.middleware");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Gán lại dữ liệu đã parse sạch (đúng type) vào request
            req.body = parsed.body || req.body;
            req.query = parsed.query || req.query;
            req.params = parsed.params || req.params;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((err) => `${err.path.filter(p => p !== 'body' && p !== 'query' && p !== 'params').join('.')}: ${err.message}`);
                return next(new error_middleware_1.AppError(errorMessages.join('; '), 400));
            }
            return next(error);
        }
    };
};
exports.validateRequest = validateRequest;
