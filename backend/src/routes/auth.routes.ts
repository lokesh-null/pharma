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

const loginSchema = {
    body: Joi.object({
        identifier: Joi.string().required().messages({
            'any.required': 'Email or phone number is required',
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required',
        }),
    }),
};

const registerSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        fullName: Joi.string().min(2).max(100).required(),
        phone: Joi.string().pattern(/^[\d\s\-()+]{3,20}$/).allow('', null).optional(),
        dateOfBirth: Joi.string().allow('', null).optional(),
        gender: Joi.string().valid('Male', 'Female', 'Other', '').allow(null).optional(),
        role: Joi.string().valid('PATIENT', 'DOCTOR', 'PHARMACIST').required(),
        password: Joi.string().min(8).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
            'any.only': 'Passwords do not match',
        }),
    }),
};

const sendOtpSchema = {
    body: Joi.object({
        email: Joi.string().required(), // Now acts as identifier (email/phone) in some flows but frontend usually sends email
    }),
};

const verifyOtpSchema = {
    body: Joi.object({
        email: Joi.string().required(),
        otp: Joi.string().length(6).pattern(/^\d{6}$/).required(),
    }),
};

const createPasswordSchema = {
    body: Joi.object({
        email: Joi.string().required(),
        otp: Joi.string().length(6).required(),
        newPassword: Joi.string().min(8).required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
    }),
};

const resetPasswordSchema = {
    body: Joi.object({
        email: Joi.string().required(),
        otp: Joi.string().length(6).required(),
        newPassword: Joi.string().min(8).required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
    }),
};

// ─── POST /api/auth/login ──────────────────────────────────────────────
router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body;
        const normalizedIdentifier = identifier.toLowerCase().trim();

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedIdentifier },
                    { phone: normalizedIdentifier }
                ]
            }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials.' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Account is deactivated. Please contact support.' });
            return;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            res.status(403).json({ error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' });
            return;
        }

        if (!user.passwordCreated || !user.passwordHash) {
            res.status(403).json({
                error: 'Account requires password creation.',
                code: 'PASSWORD_CREATION_REQUIRED',
                email: user.email
            });
            return;
        }

        const isPasswordValid = await authService.comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            const attempts = user.failedLoginAttempts + 1;
            const updateData: any = { failedLoginAttempts: attempts };
            if (attempts >= 5) {
                updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
            }
            await prisma.user.update({ where: { id: user.id }, data: updateData });

            res.status(401).json({ error: attempts >= 5 ? 'Account locked for 15 minutes.' : 'Invalid credentials.' });
            return;
        }

        // Reset attempts
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() }
        });

        const tokens = authService.generateTokenPair({ id: user.id, email: user.email, role: user.role });
        const sessionToken = authService.generateSessionToken();
        const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days session

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
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error: any) {
        logger.error('Login error:', { error: error.message });
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ─── POST /api/auth/register ─────────────────────────────────────────
router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response) => {
    try {
        const { email, fullName, phone, dateOfBirth, gender, role, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        if (role === 'ADMIN') {
            res.status(403).json({ error: 'Admin accounts cannot be self-registered.' });
            return;
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    ...(phone ? [{ phone: phone.trim() }] : [])
                ]
            }
        });

        if (existingUser) {
            res.status(409).json({ error: 'An account with this email or phone already exists.' });
            return;
        }

        const passwordHash = await authService.hashPassword(password);

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
                passwordHash,
                passwordCreated: true,
                lastPasswordChange: new Date()
            },
        });

        const { otpCode, error: otpError } = await otpService.generateOtp(user.id);
        if (!otpCode) {
            res.status(429).json({ error: otpError || 'Failed to generate OTP.' });
            return;
        }

        await emailService.sendOtpEmail(normalizedEmail, otpCode);

        res.status(201).json({
            message: 'Account created successfully. OTP sent to your email.',
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        });
    } catch (error: any) {
        logger.error('Registration error:', { error: error.message });
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ─── POST /api/auth/send-otp ─────────────────────────────────────────
router.post('/send-otp', validateRequest(sendOtpSchema), async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { phone: normalizedEmail }
                ]
            }
        });

        if (!user || !user.isActive) {
            res.json({ message: 'If an account exists, an OTP has been sent.' });
            return;
        }

        const { otpCode, error: otpError } = await otpService.generateOtp(user.id);
        if (!otpCode) {
            res.status(429).json({ error: otpError || 'Failed to generate OTP.' });
            return;
        }

        await emailService.sendOtpEmail(user.email, otpCode);

        res.json({ message: 'OTP sent to your email.' });
    } catch (error: any) {
        logger.error('Send OTP error:', { error: error.message });
        res.status(500).json({ error: 'Failed to send OTP.' });
    }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────
router.post('/verify-otp', validateRequest(verifyOtpSchema), async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Invalid email or OTP.' });
            return;
        }

        const { valid, error: otpError } = await otpService.verifyOtp(user.id, otp);
        if (!valid) {
            res.status(401).json({ error: otpError || 'Invalid OTP.' });
            return;
        }

        await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });

        const tokens = authService.generateTokenPair({ id: user.id, email: user.email, role: user.role });
        const sessionToken = authService.generateSessionToken();
        
        await prisma.session.create({
            data: {
                userId: user.id,
                sessionToken,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        res.json({
            message: 'Verification successful.',
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Verification failed.' });
    }
});

// ─── POST /api/auth/create-password ──────────────────────────────────
router.post('/create-password', validateRequest(createPasswordSchema), async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Invalid details.' });
            return;
        }

        const { valid, error: otpError } = await otpService.verifyOtp(user.id, otp);
        if (!valid) {
            res.status(401).json({ error: otpError || 'Invalid OTP.' });
            return;
        }

        const passwordHash = await authService.hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash, passwordCreated: true, lastPasswordChange: new Date() }
        });

        const tokens = authService.generateTokenPair({ id: user.id, email: user.email, role: user.role });
        const sessionToken = authService.generateSessionToken();
        
        await prisma.session.create({
            data: { userId: user.id, sessionToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        });

        res.json({
            message: 'Password created successfully.',
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create password.' });
    }
});

// ─── POST /api/auth/reset-password ──────────────────────────────────
router.post('/reset-password', validateRequest(resetPasswordSchema), async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: normalizedEmail }, { phone: normalizedEmail }]
            }
        });

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Invalid details.' });
            return;
        }

        const { valid, error: otpError } = await otpService.verifyOtp(user.id, otp);
        if (!valid) {
            res.status(401).json({ error: otpError || 'Invalid OTP.' });
            return;
        }

        const passwordHash = await authService.hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash, passwordCreated: true, lastPasswordChange: new Date(), failedLoginAttempts: 0, lockedUntil: null }
        });

        await prisma.session.deleteMany({ where: { userId: user.id } });

        res.json({ message: 'Password reset successfully. Please log in.' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

// ─── POST /api/auth/resend-otp ───────────────────────────────────────
router.post('/resend-otp', validateRequest(sendOtpSchema), async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findFirst({
            where: { OR: [{ email: normalizedEmail }, { phone: normalizedEmail }] }
        });

        if (!user || !user.isActive) {
            res.json({ message: 'If an account exists, a new OTP has been sent.' });
            return;
        }

        const { otpCode, error: otpError } = await otpService.generateOtp(user.id);
        if (!otpCode) {
            res.status(429).json({ error: otpError || 'Please wait before requesting a new OTP.' });
            return;
        }

        await emailService.sendOtpEmail(user.email, otpCode);

        res.json({ message: 'New OTP sent to your email.' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to resend OTP.' });
    }
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' }) as any;

        const decoded = authService.verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid token.' }) as any;

        const accessToken = authService.generateAccessToken({ userId: user.id, email: user.email, role: user.role });
        res.json({ accessToken });
    } catch (error: any) {
        res.status(401).json({ error: 'Session expired.' });
    }
});

// ─── POST /api/auth/logout ──────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = authService.verifyAccessToken(token);
            await prisma.session.deleteMany({ where: { userId: decoded.userId } });
        }
        res.json({ message: 'Logout successful.' });
    } catch (error: any) {
        res.json({ message: 'Logout successful.' });
    }
});

export default router;
