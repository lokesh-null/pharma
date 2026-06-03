import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/users/search/:identifier
 * Search for a user (patient) by email or ID. Used by doctors for lookup.
 */
router.get(
    '/search/:identifier',
    authenticate,
    requireRole(UserRole.DOCTOR, UserRole.ADMIN, UserRole.NURSE, UserRole.PHARMACIST),
    auditLog('SEARCH_PATIENT', 'user'),
    async (req: Request, res: Response) => {
        try {
            const { identifier } = req.params;

            // Search by email first, if not found then by ID
            const isEmail = identifier.includes('@');
            let user;

            if (isEmail) {
                user = await prisma.user.findUnique({
                    where: { email: identifier.toLowerCase().trim() },
                    select: { id: true, email: true, fullName: true, phone: true, dateOfBirth: true, gender: true, role: true, profilePicture: true }
                });
            } else {
                user = await prisma.user.findUnique({
                    where: { id: identifier },
                    select: { id: true, email: true, fullName: true, phone: true, dateOfBirth: true, gender: true, role: true, profilePicture: true }
                });
            }

            if (!user) {
                res.status(404).json({ error: 'Patient not found' });
                return;
            }

            if (user.role !== 'PATIENT') {
                res.status(400).json({ error: 'Found user is not a patient' });
                return;
            }

            res.json({
                message: 'Patient found',
                patient: user
            });
        } catch (error: any) {
            console.error('Search patient error:', error.message);
            res.status(500).json({ error: 'Failed to search for patient' });
        }
    }
);

export default router;
