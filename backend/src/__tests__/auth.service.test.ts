/**
 * Auth Service Tests — Email OTP Authentication
 */

// Mock environment variables before importing AuthService
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-long';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
    let authService: AuthService;

    beforeAll(() => {
        authService = new AuthService();
    });

    describe('JWT Token Generation', () => {
        const testUser = {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'PATIENT'
        };

        it('should generate a valid access token', () => {
            const token = authService.generateAccessToken({
                userId: testUser.id,
                email: testUser.email,
                role: testUser.role
            });

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should generate a valid refresh token', () => {
            const token = authService.generateRefreshToken({
                userId: testUser.id
            });

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('should generate a token pair', () => {
            const tokens = authService.generateTokenPair(testUser);

            expect(tokens.accessToken).toBeDefined();
            expect(tokens.refreshToken).toBeDefined();
        });

        it('should verify a valid access token', () => {
            const token = authService.generateAccessToken({
                userId: testUser.id,
                email: testUser.email,
                role: testUser.role
            });

            const decoded = authService.verifyAccessToken(token);
            expect(decoded.userId).toBe(testUser.id);
            expect(decoded.email).toBe(testUser.email);
            expect(decoded.role).toBe(testUser.role);
        });

        it('should verify a valid refresh token', () => {
            const token = authService.generateRefreshToken({
                userId: testUser.id
            });

            const decoded = authService.verifyRefreshToken(token);
            expect(decoded.userId).toBe(testUser.id);
        });

        it('should reject an invalid access token', () => {
            expect(() => {
                authService.verifyAccessToken('invalid-token');
            }).toThrow('Invalid token');
        });

        it('should reject an invalid refresh token', () => {
            expect(() => {
                authService.verifyRefreshToken('invalid-token');
            }).toThrow('Invalid refresh token');
        });
    });

    describe('Session Token Generation', () => {
        it('should generate a secure random session token', () => {
            const token = authService.generateSessionToken();
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBe(96); // 48 bytes = 96 hex chars
        });

        it('should generate unique session tokens', () => {
            const token1 = authService.generateSessionToken();
            const token2 = authService.generateSessionToken();
            expect(token1).not.toBe(token2);
        });
    });
});
