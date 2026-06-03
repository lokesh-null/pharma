import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getAuthService } from '../services/auth.service';
import { getOtpService } from '../services/otp.service';
import { getEmailService } from '../services/email.service';
import { validateRequest } from '../middleware/security.middleware';
import Joi from 'joi';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const authService = getAuthService();
const otpService = getOtpService();
const emailService = getEmailService();

// ─── Validation Schemas ──────────────────────────────────────────────

const checkEmailSchema = {
    body: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email address is required',
        }),
    }),
};

const registerSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        fullName: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Full name must be at least 2 characters',
            'any.required': 'Full name is required',
        }),
        phone: Joi.string().pattern(/^[\d\s\-()+]{3,20}$/).allow('', null).optional().messages({
            'string.pattern.base': 'Phone number contains invalid characters'
        }),
        dateOfBirth: Joi.string().allow('', null).optional(),
        gender: Joi.string().valid('Male', 'Female', 'Other', '').allow(null).optional(),
        role: Joi.string().valid('PATIENT', 'DOCTOR', 'PHARMACIST').required().messages({
            'any.only': 'Role must be Patient, Doctor, or Pharmacist',
            'any.required': 'Role is required',
        }),
    }),
};

const sendOtpSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
    }),
};

const verifyOtpSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
            'string.length': 'OTP must be 6 digits',
            'string.pattern.base': 'OTP must contain only digits',
        }),
    }),
};

const resendOtpSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
    }),
};

// ─── POST /api/auth/check-email ──────────────────────────────────────
// Check if a user exists with the given email
router.post('/check-email', validateRequest(checkEmailSchema), async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, fullName: true, role: true, isActive: true },
        });

        if (user) {
            if (!user.isActive) {
                res.status(403).json({
                    error: 'Account is deactivated. Please contact support.',
                });
                return;
            }

            res.json({
                exists: true,
                message: 'Account found. OTP will be sent to your email.',
                user: {
                    fullName: user.fullName,
                    role: user.role,
                },
            });
        } else {
            res.json({
                exists: false,
                message: 'No account found. Please create a new account.',
            });
        }
    } catch (error: any) {
        logger.error('Check email error:', { error: error.message });
        res.status(500).json({ error: 'Unable to check email. Please try again.' });
    }
});

// ─── POST /api/auth/register ─────────────────────────────────────────
// Register a new user (Patient, Doctor, or Pharmacist only)
router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response) => {
    try {
        const { email, fullName, phone, dateOfBirth, gender, role } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // Block ADMIN self-registration
        if (role === 'ADMIN') {
            res.status(403).json({
                error: 'Admin accounts cannot be self-registered.',
            });
            return;
        }

        // Check for duplicate email
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            res.status(409).json({
                error: 'An account with this email already exists.',
            });
            return;
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                fullName: fullName.trim(),
                phone: phone?.trim() || null,
                dateOfBirth: dateOfBirth || null,
                gender: gender || null,
                role,
                isVerified: false,
                isActive: true,
            },
        });

        // Generate and send OTP
        const { otpCode, error: otpError } = await otpService.generateOtp(user.id);

        if (!otpCode) {
            res.status(429).json({ error: otpError || 'Failed to generate OTP.' });
            return;
        }

        const emailSent = await emailService.sendOtpEmail(normalizedEmail, otpCode);

        if (!emailSent) {
            logger.error('Failed to send OTP email during registration', { email: normalizedEmail });
        }

        res.status(201).json({
            message: 'Account created successfully. OTP sent to your email.',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error: any) {
        logger.error('Registration error:', { error: error.message });
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ─── POST /api/auth/send-otp ─────────────────────────────────────────
// Generate and send OTP to a registered user's email
router.post('/send-otp', validateRequest(sendOtpSchema), async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            // Don't reveal whether account exists for security
            res.json({
                message: 'If an account exists with this email, an OTP has been sent.',
            });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({
                error: 'Account is deactivated. Please contact support.',
            });
            return;
        }

        const { otpCode, error: otpError } = await otpService.generateOtp(user.id);

        if (!otpCode) {
            res.status(429).json({ error: otpError || 'Failed to generate OTP.' });
            return;
        }

        const emailSent = await emailService.sendOtpEmail(normalizedEmail, otpCode);

        if (!emailSent) {
            logger.error('Failed to send OTP email', { email: normalizedEmail });
            res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
            return;
        }

        res.json({
            message: 'OTP sent to your email.',
        });
    } catch (error: any) {
        logger.error('Send OTP error:', { error: error.message });
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────
// Verify OTP, create session, return JWT tokens
router.post('/verify-otp', validateRequest(verifyOtpSchema), async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid email or OTP.' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Account is deactivated.' });
            return;
        }

        // Verify OTP
        const { valid, error: otpError } = await otpService.verifyOtp(user.id, otp);

        if (!valid) {
            res.status(401).json({
                error: otpError || 'Invalid OTP.',
            });
            return;
        }

        // Generate JWT tokens
        const tokens = authService.generateTokenPair({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // Create session
        const sessionToken = authService.generateSessionToken();
        const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.session.create({
            data: {
                userId: user.id,
                sessionToken,
                expiresAt: sessionExpiry,
                deviceInfo: req.headers['user-agent'] || null,
                ipAddress: req.ip || req.socket.remoteAddress || null,
            },
        });

        res.json({
            message: 'Login successful.',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error: any) {
        logger.error('Verify OTP error:', { error: error.message });
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

// ─── POST /api/auth/resend-otp ───────────────────────────────────────
// Resend OTP with rate limiting
router.post('/resend-otp', validateRequest(resendOtpSchema), async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            // Don't reveal whether account exists
            res.json({ message: 'If an account exists, a new OTP has been sent.' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Account is deactivated.' });
            return;
        }

        const { otpCode, error: otpError } = await otpService.generateOtp(user.id);

        if (!otpCode) {
            res.status(429).json({ error: otpError || 'Please wait before requesting a new OTP.' });
            return;
        }

        const emailSent = await emailService.sendOtpEmail(normalizedEmail, otpCode);

        if (!emailSent) {
            res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
            return;
        }

        res.json({ message: 'New OTP sent to your email.' });
    } catch (error: any) {
        logger.error('Resend OTP error:', { error: error.message });
        res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
    }
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────
// Refresh access token using refresh token
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required.' });
            return;
        }

        const decoded = authService.verifyRefreshToken(refreshToken);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Invalid refresh token.' });
            return;
        }

        const accessToken = authService.generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({ accessToken });
    } catch (error: any) {
        if (error.message === 'Refresh token expired') {
            res.status(401).json({ error: 'Session expired. Please login again.' });
        } else {
            res.status(401).json({ error: 'Invalid refresh token.' });
        }
    }
});

// ─── POST /api/auth/logout ──────────────────────────────────────────
// Invalidate session and clear tokens
router.post('/logout', async (req: Request, res: Response) => {
    try {
        // Try to get user from token to clean up sessions
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = authService.verifyAccessToken(token);

                // Delete all sessions for this user
                await prisma.session.deleteMany({
                    where: { userId: decoded.userId },
                });
            } catch {
                // Token might be expired, but still allow logout
            }
        }

        res.json({ message: 'Logout successful.' });
    } catch (error: any) {
        logger.error('Logout error:', { error: error.message });
        res.json({ message: 'Logout successful.' }); // Always succeed on logout
    }
});

export default router;
