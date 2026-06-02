import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

export enum ConsentScope {
    VIEW_MEDICAL_RECORDS = 'VIEW_MEDICAL_RECORDS',
    VIEW_AADHAAR = 'VIEW_AADHAAR',
    UPDATE_RECORDS = 'UPDATE_RECORDS'
}

const prisma = new PrismaClient();

/**
 * Consent Management Service
 * Handles time-bound, scope-limited consent tokens
 */
export class ConsentService {
    private readonly CONSENT_TOKEN_SECRET = process.env.CONSENT_TOKEN_SECRET!;

    /**
     * Generate consent token
     * JWT with patientId, grantedTo, scopes, expiresAt
     */
    async generateConsentToken(
        patientId: string,
        grantedTo: string,
        scopes: ConsentScope[],
        expiryMinutes: number = 60
    ): Promise<{ token: string; consentId: string }> {
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Create consent record in database
        const consent = await prisma.consent.create({
            data: {
                patientId,
                grantedTo,
                scopes: JSON.stringify(scopes), // Store as JSON string
                expiresAt
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                consentId: consent.id,
                patientId,
                grantedTo,
                scopes,
                expiresAt: expiresAt.toISOString()
            },
            this.CONSENT_TOKEN_SECRET,
            {
                expiresIn: `${expiryMinutes}m`,
                issuer: 'pharmalync',
                audience: 'pharmalync-consent',
                algorithm: 'HS256'
            }
        );

        return { token, consentId: consent.id };
    }

    /**
     * Verify consent token
     * Checks signature, expiry, scope, and revocation status
     */
    async verifyConsentToken(
        token: string,
        requiredScopes: ConsentScope[]
    ): Promise<{
        valid: boolean;
        consentId?: string;
        patientId?: string;
        grantedTo?: string;
        scopes?: ConsentScope[];
        error?: string;
    }> {
        try {
            // Verify JWT signature and expiry
            const decoded = jwt.verify(token, this.CONSENT_TOKEN_SECRET, {
                issuer: 'pharmalync',
                audience: 'pharmalync-consent',
                algorithms: ['HS256']
            }) as any;

            // Check if consent is revoked in database
            const consent = await prisma.consent.findUnique({
                where: { id: decoded.consentId }
            });

            if (!consent) {
                return { valid: false, error: 'Consent not found' };
            }

            if (consent.revoked) {
                return { valid: false, error: 'Consent has been revoked' };
            }

            if (new Date() > consent.expiresAt) {
                return { valid: false, error: 'Consent has expired' };
            }

            // Check if required scopes are present
            const scopes = JSON.parse(consent.scopes as string) as string[];
            const hasRequiredScopes = requiredScopes.every(scope =>
                scopes.includes(scope)
            );

            if (!hasRequiredScopes) {
                return { valid: false, error: 'Insufficient consent scopes' };
            }

            return {
                valid: true,
                consentId: consent.id,
                patientId: consent.patientId,
                grantedTo: consent.grantedTo,
                scopes: scopes as ConsentScope[]
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return { valid: false, error: 'Consent token expired' };
            } else if (error instanceof jwt.JsonWebTokenError) {
                return { valid: false, error: 'Invalid consent token' };
            }
            return { valid: false, error: 'Consent verification failed' };
        }
    }

    /**
     * Revoke consent
     */
    async revokeConsent(consentId: string): Promise<void> {
        await prisma.consent.update({
            where: { id: consentId },
            data: { revoked: true }
        });
    }

    /**
     * Get active consents for a patient
     */
    async getActiveConsents(patientId: string): Promise<any[]> {
        return prisma.consent.findMany({
            where: {
                patientId,
                revoked: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
    }

    /**
     * Check if user has consent for specific action
     */
    async checkConsent(
        patientId: string,
        userId: string,
        requiredScopes: ConsentScope[]
    ): Promise<boolean> {
        const consent = await prisma.consent.findFirst({
            where: {
                patientId,
                grantedTo: userId,
                revoked: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!consent) return false;

        const scopes = JSON.parse(consent.scopes as string) as string[];
        return requiredScopes.every(scope => scopes.includes(scope));
    }
}

// Singleton instance
let consentServiceInstance: ConsentService | null = null;

export function getConsentService(): ConsentService {
    if (!consentServiceInstance) {
        consentServiceInstance = new ConsentService();
    }
    return consentServiceInstance;
}
