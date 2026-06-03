import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * OTP Service
 * Handles OTP generation, verification, and lifecycle management.
 * 
 * Security features:
 * - Cryptographically secure 6-digit OTP (crypto.randomInt)
 * - OTPs are hashed (SHA-256) before storage — raw OTP never persisted
 * - 5-minute expiration
 * - Max 5 verification attempts per OTP
 * - Max 5 OTP generations per user per 15-minute window
 * - Used OTPs are immediately invalidated
 */
export class OtpService {
    private readonly OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    private readonly MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5');
    private readonly MAX_RESENDS = parseInt(process.env.OTP_MAX_RESENDS || '5');
    private readonly RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '30');

    /**
     * Hash an OTP code using SHA-256
     */
    private hashOtp(otp: string): string {
        return crypto.createHash('sha256').update(otp).digest('hex');
    }

    /**
     * Generate a cryptographically secure 6-digit OTP
     */
    private generateOtpCode(): string {
        const otp = crypto.randomInt(100000, 999999);
        return otp.toString();
    }

    /**
     * Generate and store a new OTP for a user.
     * Invalidates any existing active OTPs first.
     * 
     * @returns The raw OTP code (for sending via email) or null if rate-limited
     */
    async generateOtp(userId: string): Promise<{ otpCode: string | null; error?: string }> {
        // Check rate limit — max OTPs in the last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentOtpCount = await prisma.otp.count({
            where: {
                userId,
                createdAt: { gte: fifteenMinutesAgo },
            },
        });

        if (recentOtpCount >= this.MAX_RESENDS) {
            return {
                otpCode: null,
                error: 'Too many OTP requests. Please try again later.',
            };
        }

        // Check cooldown — must wait before requesting another OTP
        const cooldownTime = new Date(Date.now() - this.RESEND_COOLDOWN_SECONDS * 1000);
        const recentOtp = await prisma.otp.findFirst({
            where: {
                userId,
                createdAt: { gte: cooldownTime },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (recentOtp) {
            const waitSeconds = Math.ceil(
                (recentOtp.createdAt.getTime() + this.RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
            );
            return {
                otpCode: null,
                error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
            };
        }

        // Invalidate all existing active OTPs for this user
        await this.invalidateOtps(userId);

        // Generate new OTP
        const rawOtp = this.generateOtpCode();
        const hashedOtp = this.hashOtp(rawOtp);
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

        await prisma.otp.create({
            data: {
                userId,
                otpCode: hashedOtp,
                expiresAt,
            },
        });

        logger.info('OTP generated', { userId, expiresAt: expiresAt.toISOString() });

        return { otpCode: rawOtp };
    }

    /**
     * Verify an OTP for a user.
     * 
     * @returns true if valid, or an error message
     */
    async verifyOtp(userId: string, otpCode: string): Promise<{ valid: boolean; error?: string }> {
        const hashedOtp = this.hashOtp(otpCode);

        // Find the most recent unused, non-expired OTP for this user
        const otp = await prisma.otp.findFirst({
            where: {
                userId,
                isUsed: false,
                expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otp) {
            return { valid: false, error: 'OTP expired. Please request a new one.' };
        }

        // Check attempt limit
        if (otp.attemptCount >= this.MAX_ATTEMPTS) {
            // Invalidate this OTP
            await prisma.otp.update({
                where: { id: otp.id },
                data: { isUsed: true },
            });
            return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
        }

        // Compare hashed OTPs using constant-time comparison
        const otpBuffer = Buffer.from(hashedOtp, 'hex');
        const storedBuffer = Buffer.from(otp.otpCode, 'hex');

        let isMatch = false;
        try {
            isMatch = crypto.timingSafeEqual(otpBuffer, storedBuffer);
        } catch {
            isMatch = false;
        }

        if (!isMatch) {
            // Increment attempt count
            await prisma.otp.update({
                where: { id: otp.id },
                data: { attemptCount: otp.attemptCount + 1 },
            });

            const attemptsLeft = this.MAX_ATTEMPTS - (otp.attemptCount + 1);
            return {
                valid: false,
                error: attemptsLeft > 0
                    ? `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`
                    : 'Too many incorrect attempts. Please request a new OTP.',
            };
        }

        // OTP is valid — mark as used
        await prisma.otp.update({
            where: { id: otp.id },
            data: { isUsed: true },
        });

        // Update user's last login
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastLogin: new Date(),
                isVerified: true,
            },
        });

        logger.info('OTP verified successfully', { userId });
        return { valid: true };
    }

    /**
     * Invalidate all active OTPs for a user
     */
    async invalidateOtps(userId: string): Promise<void> {
        await prisma.otp.updateMany({
            where: {
                userId,
                isUsed: false,
            },
            data: { isUsed: true },
        });
    }

    /**
     * Clean up expired OTPs older than 24 hours
     */
    async cleanExpiredOtps(): Promise<number> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await prisma.otp.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: twentyFourHoursAgo } },
                    { isUsed: true, createdAt: { lt: twentyFourHoursAgo } },
                ],
            },
        });

        if (result.count > 0) {
            logger.info(`Cleaned ${result.count} expired OTPs`);
        }

        return result.count;
    }

    /**
     * Check if a user can request a resend (30s cooldown check)
     */
    async canResend(userId: string): Promise<{ canResend: boolean; waitSeconds?: number }> {
        const cooldownTime = new Date(Date.now() - this.RESEND_COOLDOWN_SECONDS * 1000);
        const recentOtp = await prisma.otp.findFirst({
            where: {
                userId,
                createdAt: { gte: cooldownTime },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (recentOtp) {
            const waitSeconds = Math.ceil(
                (recentOtp.createdAt.getTime() + this.RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
            );
            return { canResend: false, waitSeconds };
        }

        return { canResend: true };
    }
}

// Singleton instance
let otpServiceInstance: OtpService | null = null;

export function getOtpService(): OtpService {
    if (!otpServiceInstance) {
        otpServiceInstance = new OtpService();
    }
    return otpServiceInstance;
}
