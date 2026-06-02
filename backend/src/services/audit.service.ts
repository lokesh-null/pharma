import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getBlockchainService } from './blockchain.service';

const prisma = new PrismaClient();

/**
 * Critical actions that require blockchain logging
 */
export enum CriticalAction {
    VIEW_AADHAAR = 'VIEW_AADHAAR',
    CREATE_PATIENT = 'CREATE_PATIENT',
    UPDATE_PATIENT = 'UPDATE_PATIENT',
    MEDICINE_DISPENSE = 'MEDICINE_DISPENSE',
    PRESCRIPTION_CREATE = 'PRESCRIPTION_CREATE'
}

/**
 * Audit Logging Service
 * Tier 1: Local database logging
 * Tier 2: Blockchain logging for critical actions
 */
export class AuditService {
    private blockchainService = getBlockchainService();

    /**
     * Check if action is critical (requires blockchain logging)
     */
    private isCriticalAction(action: string): boolean {
        return Object.values(CriticalAction).includes(action as CriticalAction);
    }

    /**
     * Create SHA-256 hash of audit data for blockchain
     */
    private hashAuditData(auditData: {
        userId: string;
        action: string;
        resourceType: string;
        resourceId?: string;
        timestamp: Date;
    }): string {
        const data = JSON.stringify({
            userId: auditData.userId,
            action: auditData.action,
            resourceType: auditData.resourceType,
            resourceId: auditData.resourceId || '',
            timestamp: auditData.timestamp.toISOString()
        });

        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Tier 1: Log to local database
     */
    async logAudit(params: {
        userId: string;
        action: string;
        resourceType: string;
        resourceId?: string;
        metadata?: any;
    }): Promise<string> {
        const timestamp = new Date();

        // Create audit log in database
        const auditLog = await prisma.auditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                resourceType: params.resourceType,
                resourceId: params.resourceId,
                metadata: params.metadata ? JSON.stringify(params.metadata) : null,
                timestamp
            }
        });

        // If critical action, also log to blockchain (async, non-blocking)
        if (this.isCriticalAction(params.action)) {
            this.logCriticalAudit(auditLog.id, {
                userId: params.userId,
                action: params.action,
                resourceType: params.resourceType,
                resourceId: params.resourceId,
                timestamp
            }).catch(error => {
                console.error('Blockchain audit logging failed:', error);
                // Don't throw - blockchain logging failure shouldn't block the operation
            });
        }

        return auditLog.id;
    }

    /**
     * Tier 2: Log critical actions to blockchain
     */
    private async logCriticalAudit(
        auditId: string,
        auditData: {
            userId: string;
            action: string;
            resourceType: string;
            resourceId?: string;
            timestamp: Date;
        }
    ): Promise<void> {
        // Create hash of audit data
        const hash = this.hashAuditData(auditData);

        try {
            // Log to blockchain
            const txHash = await this.blockchainService.logAuditToBlockchain(
                auditId,
                auditData.action,
                hash,
                auditData.timestamp
            );

            // Update audit log with blockchain transaction hash
            await prisma.auditLog.update({
                where: { id: auditId },
                data: { blockchainTxHash: txHash }
            });
        } catch (error) {
            console.error('Failed to log to blockchain:', error);
            throw error;
        }
    }

    /**
     * Query audit logs with filters
     */
    async queryAuditLogs(filters: {
        userId?: string;
        action?: string;
        resourceType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<any[]> {
        const where: any = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.action) where.action = filters.action;
        if (filters.resourceType) where.resourceType = filters.resourceType;

        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) where.timestamp.gte = filters.startDate;
            if (filters.endDate) where.timestamp.lte = filters.endDate;
        }

        return prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: filters.limit || 100,
            skip: filters.offset || 0
        });
    }

    /**
     * Get audit log by ID
     */
    async getAuditLog(id: string): Promise<any> {
        return prisma.auditLog.findUnique({
            where: { id },
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
     * Verify audit integrity against blockchain
     */
    async verifyAuditIntegrity(auditId: string): Promise<{
        valid: boolean;
        localHash: string;
        blockchainHash?: string;
        error?: string;
    }> {
        const auditLog = await this.getAuditLog(auditId);

        if (!auditLog) {
            return { valid: false, localHash: '', error: 'Audit log not found' };
        }

        // Calculate local hash
        const localHash = this.hashAuditData({
            userId: auditLog.userId,
            action: auditLog.action,
            resourceType: auditLog.resourceType,
            resourceId: auditLog.resourceId,
            timestamp: auditLog.timestamp
        });

        // If not logged to blockchain, return local hash only
        if (!auditLog.blockchainTxHash) {
            return { valid: true, localHash, error: 'Not logged to blockchain' };
        }

        try {
            // Verify against blockchain
            const blockchainHash = await this.blockchainService.verifyAudit(auditId);

            const valid = localHash === blockchainHash;

            return {
                valid,
                localHash,
                blockchainHash,
                error: valid ? undefined : 'Hash mismatch - data may be tampered'
            };
        } catch (error) {
            return {
                valid: false,
                localHash,
                error: `Blockchain verification failed: ${error}`
            };
        }
    }
}

// Singleton instance
let auditServiceInstance: AuditService | null = null;

export function getAuditService(): AuditService {
    if (!auditServiceInstance) {
        auditServiceInstance = new AuditService();
    }
    return auditServiceInstance;
}
