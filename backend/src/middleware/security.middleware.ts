import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Helmet security headers configuration
 */
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    noSniff: true,
    xssFilter: true
});

/**
 * CORS configuration
 */
export const corsConfig = cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:5173',
            'http://localhost:3000'
        ];

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Consent-Token']
});

/**
 * Rate limiting configuration
 */
export const rateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'You have exceeded the rate limit. Please try again later.'
        });
    }
});

/**
 * Stricter rate limiter for authentication endpoints
 * Prevents OTP brute-force attacks
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 auth requests per window per IP
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too Many Attempts',
            message: 'Too many authentication attempts. Please try again later.'
        });
    }
});

/**
 * Input validation middleware factory
 */
export function validateRequest(schema: {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
}) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: any = {};

        // Validate body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                errors.body = error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }));
            }
        }

        // Validate params
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                errors.params = error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }));
            }
        }

        // Validate query
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                errors.query = error.details.map(d => ({
                    field: d.path.join('.'),
                    message: d.message
                }));
            }
        }

        // If there are validation errors, return 400
        if (Object.keys(errors).length > 0) {
            console.warn('Validation failed:', JSON.stringify(errors, null, 2));
            res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
            return;
        }

        next();
    };
}

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from input
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
    // Sanitize body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        // Remove HTML tags and dangerous characters
        return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim();
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }

    return obj;
}

/**
 * Error handling middleware
 */
export function errorHandler(
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error:', err);

    // Prisma errors
    if (err.code === 'P2002') {
        res.status(409).json({
            error: 'Conflict',
            message: 'A record with this value already exists'
        });
        return;
    }

    if (err.code === 'P2025') {
        res.status(404).json({
            error: 'Not Found',
            message: 'The requested resource was not found'
        });
        return;
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}
