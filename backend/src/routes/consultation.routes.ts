import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

const createConsultationSchema = Joi.object({
    patientId: Joi.string().required(),
    symptoms: Joi.array().items(Joi.string().allow('')).optional(),
    diagnosis: Joi.string().required(),
    notes: Joi.string().allow('').optional(),
    priority: Joi.string().valid('Normal', 'High', 'Urgent').optional()
});

/**
 * POST /api/consultations
 * Start a consultation (create)
 */
router.post(
    '/',
    authenticate,
    requireRole(UserRole.DOCTOR, UserRole.ADMIN),
    auditLog('CREATE_CONSULTATION', 'consultation'),
    async (req: Request, res: Response) => {
        try {
            const { error, value } = createConsultationSchema.validate(req.body);
            if (error) {
                console.error("Consultation validation error:", error.details[0].message);
                res.status(400).json({ error: error.details[0].message });
                return;
            }

            const { patientId, symptoms, diagnosis, notes, priority } = value;
            const doctorId = req.user!.userId;

            const consultation = await prisma.consultation.create({
                data: {
                    doctorId,
                    patientId,
                    symptoms: JSON.stringify(symptoms || []),
                    diagnosis,
                    notes: notes || '',
                    priority: priority || 'Normal',
                    status: 'Active'
                }
            });

            // Also push to Medical History
            await prisma.medicalHistory.create({
                data: {
                    patientId,
                    doctorId,
                    diagnosis,
                    notes: notes || ''
                }
            });

            res.status(201).json({
                message: 'Consultation created',
                consultation
            });
        } catch (error: any) {
            console.error('Create consultation error:', error);
            res.status(500).json({ error: 'Failed to create consultation', details: error.message });
        }
    }
);

/**
 * GET /api/consultations/patient/:patientId
 * Get history for a patient
 */
router.get(
    '/patient/:patientId',
    authenticate,
    requireRole(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT),
    async (req: Request, res: Response) => {
        try {
            const { patientId } = req.params;

            // Optional: verify if PATIENT role is requesting their own history
            if (req.user!.role === 'PATIENT' && req.user!.userId !== patientId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            const consultations = await prisma.consultation.findMany({
                where: { patientId },
                include: {
                    doctor: {
                        select: { fullName: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const mapped = consultations.map(c => ({
                id: c.id,
                doctor: c.doctor.fullName,
                doctorId: c.doctorId,
                diagnosis: c.diagnosis,
                symptoms: JSON.parse(c.symptoms || '[]'),
                notes: c.notes,
                status: c.status,
                priority: c.priority,
                date: new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                hospital: 'PharmaLync Network'
            }));

            res.json({ history: mapped });
        } catch (error: any) {
            console.error('Fetch history error:', error.message);
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    }
);

/**
 * GET /api/consultations/doctor/:doctorId
 * Get history for a doctor
 */
router.get(
    '/doctor/:doctorId',
    authenticate,
    requireRole(UserRole.DOCTOR, UserRole.ADMIN),
    async (req: Request, res: Response) => {
        try {
            const { doctorId } = req.params;

            if (req.user!.role === 'DOCTOR' && req.user!.userId !== doctorId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            const consultations = await prisma.consultation.findMany({
                where: { doctorId },
                include: {
                    patient: {
                        select: { fullName: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            const mapped = consultations.map(c => ({
                id: c.id,
                patientName: c.patient.fullName,
                patientId: c.patientId,
                diagnosis: c.diagnosis,
                status: c.status,
                time: new Date(c.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                date: new Date(c.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
            }));

            res.json({ history: mapped });
        } catch (error: any) {
            console.error('Fetch doctor history error:', error.message);
            res.status(500).json({ error: 'Failed to fetch doctor history' });
        }
    }
);

export default router;
