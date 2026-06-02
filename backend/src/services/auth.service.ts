import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Authentication Service
 * Handles password hashing (PBKDF2-SHA512) and JWT token management
 */
export class AuthService {
    private readonly PBKDF2_ITERATIONS = parseInt(process.env.PBKDF2_ITERATIONS || '10000');
    private readonly SALT_LENGTH = 16;
    private readonly HASH_LENGTH = 64;

    private readonly JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
    private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    private readonly JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
    private readonly JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

    /**
     * Hash password using PBKDF2-SHA512
     * Storage format: salt:hash (both in hex)
     */
    async hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Generate random 16-byte salt
            const salt = crypto.randomBytes(this.SALT_LENGTH);

            // Hash password with PBKDF2-SHA512
            crypto.pbkdf2(
                password,
                salt,
                this.PBKDF2_ITERATIONS,
                this.HASH_LENGTH,
                'sha512',
                (err, derivedKey) => {
                    if (err) reject(err);

                    // Combine salt and hash
                    const hash = derivedKey.toString('hex');
                    const saltHex = salt.toString('hex');
                    resolve(`${saltHex}:${hash}`);
                }
            );
        });
    }

    /**
     * Verify password using constant-time comparison
     */
    async verifyPassword(password: string, storedHash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // Split stored hash into salt and hash
            const [saltHex, hashHex] = storedHash.split(':');

            if (!saltHex || !hashHex) {
                return resolve(false);
            }

            const salt = Buffer.from(saltHex, 'hex');

            // Hash the provided password with the same salt
            crypto.pbkdf2(
                password,
                salt,
                this.PBKDF2_ITERATIONS,
                this.HASH_LENGTH,
                'sha512',
                (err, derivedKey) => {
                    if (err) reject(err);

                    const hash = derivedKey.toString('hex');
                    const storedHashBuffer = Buffer.from(hashHex, 'hex');
                    const computedHashBuffer = Buffer.from(hash, 'hex');

                    // Constant-time comparison to prevent timing attacks
                    try {
                        const isValid = crypto.timingSafeEqual(storedHashBuffer, computedHashBuffer);
                        resolve(isValid);
                    } catch {
                        // Buffers are different lengths
                        resolve(false);
                    }
                }
            );
        });
    }

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
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
    if (!authServiceInstance) {
        authServiceInstance = new AuthService();
    }
    return authServiceInstance;
}
