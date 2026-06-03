import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Authentication Service
 * Handles JWT token management for Email OTP authentication.
 * Password-based auth has been removed — authentication is now OTP-only.
 */
export class AuthService {
    private readonly JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
    private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    private readonly JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
    private readonly JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

    /**
     * Generate JWT access token (15 min expiry)
     * Payload: { userId, email, role }
     */
    generateAccessToken(payload: { userId: string; email: string; role: string }): string {
        return (jwt.sign as any)(payload, this.JWT_ACCESS_SECRET, {
            expiresIn: this.JWT_ACCESS_EXPIRY,
            issuer: 'pharmalync',
            audience: 'pharmalync-api',
            algorithm: 'HS256'
        });
    }

    /**
     * Generate JWT refresh token (7 day expiry)
     * Payload: { userId }
     */
    generateRefreshToken(payload: { userId: string }): string {
        return (jwt.sign as any)(payload, this.JWT_REFRESH_SECRET, {
            expiresIn: this.JWT_REFRESH_EXPIRY,
            issuer: 'pharmalync',
            audience: 'pharmalync-api',
            algorithm: 'HS256'
        });
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token: string): { userId: string; email: string; role: string } {
        try {
            const decoded = jwt.verify(token, this.JWT_ACCESS_SECRET, {
                issuer: 'pharmalync',
                audience: 'pharmalync-api',
                algorithms: ['HS256']
            }) as any;

            return {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw error;
        }
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token: string): { userId: string } {
        try {
            const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET, {
                issuer: 'pharmalync',
                audience: 'pharmalync-api',
                algorithms: ['HS256']
            }) as any;

            return {
                userId: decoded.userId
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Refresh token expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Generate both access and refresh tokens
     */
    generateTokenPair(user: { id: string; email: string; role: string }): {
        accessToken: string;
        refreshToken: string;
    } {
        return {
            accessToken: this.generateAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role
            }),
            refreshToken: this.generateRefreshToken({
                userId: user.id
            })
        };
    }

    /**
     * Generate a secure random session token
     */
    generateSessionToken(): string {
        return crypto.randomBytes(48).toString('hex');
    }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
    if (!authServiceInstance) {
        authServiceInstance = new AuthService();
    }
    return authServiceInstance;
}
