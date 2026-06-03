import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/stats
 * Dashboard statistics for admin overview
 */
router.get(
    '/stats',
    authenticate,
    requireRole(UserRole.ADMIN),
    async (_req: Request, res: Response) => {
        try {
            const [totalUsers, totalPrescriptions, totalAuditLogs, totalConsultations] = await Promise.all([
                prisma.user.count(),
                prisma.prescription.count(),
                prisma.auditLog.count(),
                prisma.consultation.count()
            ]);

            // Prescriptions created today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dailyPrescriptions = await prisma.prescription.count({
                where: { createdAt: { gte: today } }
            });

            // Users by role
            const usersByRole = await prisma.user.groupBy({
                by: ['role'],
                _count: { id: true }
            });

            const roleMap: Record<string, number> = {};
            usersByRole.forEach(r => {
                roleMap[r.role] = r._count.id;
            });

            res.json({
                totalUsers,
                totalPrescriptions,
                dailyPrescriptions,
                totalAuditLogs,
                totalConsultations,
                usersByRole: roleMap
            });
        } catch (error: any) {
            console.error('Admin stats error:', error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    }
);

/**
 * GET /api/admin/users
 * List all users with optional role filter
 */
router.get(
    '/users',
    authenticate,
    requireRole(UserRole.ADMIN),
    async (req: Request, res: Response) => {
        try {
            const { role, search } = req.query;

            const where: any = {};
            if (role && typeof role === 'string') {
                where.role = role.toUpperCase();
            }
            if (search && typeof search === 'string') {
                where.OR = [
                    { fullName: { contains: search } },
                    { email: { contains: search } }
                ];
            }

            const users = await prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    isVerified: true,
                    isActive: true,
                    lastLogin: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ users, total: users.length });
        } catch (error: any) {
            console.error('Admin users list error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }
);

export default router;
