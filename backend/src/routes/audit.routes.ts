import { Router, Request, Response } from 'express';
import { UserRole } from '../middleware/auth.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getAuditService } from '../services/audit.service';

const router = Router();
const auditService = getAuditService();

/**
 * GET /api/audit/logs
 * Query audit logs with filters
 * Requires: ADMIN role
 */
router.get(
    '/logs',
    authenticate,
    requireRole(UserRole.ADMIN),
    async (req: Request, res: Response) => {
        try {
            const {
                userId,
                action,
                resourceType,
                startDate,
                endDate,
                limit,
                offset
            } = req.query;

            const filters: any = {};

            if (userId) filters.userId = userId as string;
            if (action) filters.action = action as string;
            if (resourceType) filters.resourceType = resourceType as string;
            if (startDate) filters.startDate = new Date(startDate as string);
            if (endDate) filters.endDate = new Date(endDate as string);
            if (limit) filters.limit = parseInt(limit as string);
            if (offset) filters.offset = parseInt(offset as string);

            const logs = await auditService.queryAuditLogs(filters);

            res.json({ logs, count: logs.length });
        } catch (error) {
            console.error('Query audit logs error:', error);
            res.status(500).json({ error: 'Failed to query audit logs' });
        }
    }
);

/**
 * GET /api/audit/logs/:id
 * Get specific audit log
 * Requires: ADMIN role
 */
router.get(
    '/logs/:id',
    authenticate,
    requireRole(UserRole.ADMIN),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const log = await auditService.getAuditLog(id);

            if (!log) {
                res.status(404).json({ error: 'Audit log not found' });
                return;
            }

            res.json({ log });
        } catch (error) {
            console.error('Get audit log error:', error);
            res.status(500).json({ error: 'Failed to retrieve audit log' });
        }
    }
);

/**
 * GET /api/audit/verify/:id
 * Verify audit log integrity against blockchain
 * Requires: ADMIN role
 */
router.get(
    '/verify/:id',
    authenticate,
    requireRole(UserRole.ADMIN),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const verification = await auditService.verifyAuditIntegrity(id);

            res.json(verification);
        } catch (error) {
            console.error('Verify audit error:', error);
            res.status(500).json({ error: 'Failed to verify audit integrity' });
        }
    }
);

export default router;
