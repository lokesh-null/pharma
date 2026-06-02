import { AuthService } from '../services/auth.service';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('Auth Service', () => {
    let authService: AuthService;

    beforeEach(() => {
        // Set environment variables for testing
        process.env.JWT_ACCESS_SECRET = 'test_access_secret';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
        process.env.PBKDF2_ITERATIONS = '1000'; // lower for faster tests
        
        authService = new AuthService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAccessToken', () => {
        it('should generate a valid JWT with the correct payload', () => {
            const mockToken = 'mock.access.token';
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);
            
            const payload = { userId: '123', email: 'test@test.com', role: 'ADMIN' };
            const token = authService.generateAccessToken(payload);
            
            expect(jwt.sign).toHaveBeenCalledWith(
                payload,
                'test_access_secret',
                expect.objectContaining({
                    expiresIn: '15m',
                    issuer: 'pharmalync',
                    audience: 'pharmalync-api',
                    algorithm: 'HS256'
                })
            );
            expect(token).toBe(mockToken);
        });
    });

    describe('verifyAccessToken', () => {
        it('should successfully verify a valid token', () => {
            const mockPayload = { userId: '123', email: 'test@test.com', role: 'ADMIN' };
            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
            
            const result = authService.verifyAccessToken('valid.token');
            expect(result).toEqual(mockPayload);
            expect(jwt.verify).toHaveBeenCalledWith(
                'valid.token',
                'test_access_secret',
                expect.objectContaining({
                    issuer: 'pharmalync',
                    audience: 'pharmalync-api',
                    algorithms: ['HS256']
                })
            );
        });

        it('should throw an error for an invalid token', () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new jwt.JsonWebTokenError('Invalid token');
            });
            
            expect(() => authService.verifyAccessToken('invalid.token')).toThrow('Invalid token');
        });
    });

    describe('Password Utils', () => {
        it('should hash a password and verify it correctly', async () => {
            const password = 'secure_password_123';
            
            // Generate hash
            const hash = await authService.hashPassword(password);
            expect(hash).toContain(':'); // Should contain salt and hash separated by colon
            
            // Verify correct password
            const isValid = await authService.verifyPassword(password, hash);
            expect(isValid).toBe(true);

            // Verify incorrect password
            const isInvalid = await authService.verifyPassword('wrong_password', hash);
            expect(isInvalid).toBe(false);
        });
    });
});
