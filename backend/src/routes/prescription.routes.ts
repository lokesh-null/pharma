import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../middleware/auth.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { validateRequest } from '../middleware/security.middleware';
import { getQrSecurityService } from '../services/qr-security.service';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();
const qrSecurityService = getQrSecurityService();

/**
 * Validation schemas
 */
const createPrescriptionSchema = {
    body: Joi.object({
        patientId: Joi.string().required(),
        medicines: Joi.array().items(Joi.object({
            medicineId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
            dosage: Joi.string().required()
        })).min(1).required()
    })
};

const dispenseSchema = {
    body: Joi.object({
        items: Joi.array().items(Joi.object({
            id: Joi.string().required(), // medicineId
            quantity: Joi.number().integer().min(1).required(),
            prescriptionId: Joi.string().allow(null).optional()
        })).min(1).required()
    })
};

/**
 * POST /api/prescriptions
 * Create a secure, signed prescription with a non-reversible QR token
 * Requires: ADMIN or NURSE role
 */
router.post(
    '/',
    authenticate,
    requireRole(UserRole.ADMIN, UserRole.DOCTOR),
    validateRequest(createPrescriptionSchema),
    auditLog('CREATE_PRESCRIPTION', 'prescription'),
    async (req: Request, res: Response) => {
        try {
            const { patientId, medicines } = req.body;
            const issuedBy = req.user!.userId;

            // 1. Create prescription using transaction
            const prescription = await prisma.prescription.create({
                data: {
                    patientId,
                    issuedBy,
                    medicines: {
                        create: medicines.map((m: any) => ({
                            medicineId: m.medicineId,
                            quantity: m.quantity,
                            dosage: m.dosage
                        }))
                    }
                },
                include: {
                    medicines: {
                        include: {
                            medicine: true
                        }
                    }
                }
            });

            // 2. Generate SECURE QR TOKEN
            // This token is encrypted (AES-GCM) and signed (HMAC-SHA512)
            const qrToken = qrSecurityService.generateSecureToken({
                prescriptionId: prescription.id,
                patientId: prescription.patientId,
                medicines: prescription.medicines.map(m => ({
                    name: m.medicine.name,
                    dosage: m.dosage,
                    quantity: m.quantity
                })),
                issuedAt: prescription.createdAt,
                exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days validity
            }, 'PRESCRIPTION');

            res.status(201).json({
                message: 'Prescription created successfully',
                prescription: {
                    id: prescription.id,
                    createdAt: prescription.createdAt
                },
                qrToken,
                note: 'The QR token is cryptographically secured. "Mining" or reversing the hash is impossible.'
            });
        } catch (error) {
            console.error('Create prescription error:', error);
            res.status(500).json({ error: 'Failed to create prescription' });
        }
    }
);

/**
 * POST /api/prescriptions/verify-qr
 * Verify a prescription QR scanned by a pharmacy
 */
router.post(
    '/verify-qr',
    authenticate,
    requireRole(UserRole.PHARMACIST, UserRole.ADMIN),
    async (req: Request, res: Response) => {
        try {
            const { qrToken } = req.body;

            if (!qrToken) {
                res.status(400).json({ error: 'QR token is required' });
                return;
            }

            // Verify signature and decrypt
            const data = qrSecurityService.verifyToken(qrToken, 'PRESCRIPTION');

            // Find in DB
            const prescription = await prisma.prescription.findUnique({
                where: { id: data.prescriptionId },
                include: {
                    medicines: {
                        include: {
                            medicine: true
                        }
                    },
                    patient: true
                }
            });

            if (!prescription) {
                res.status(404).json({ error: 'Prescription record missing' });
                return;
            }

            if (prescription.dispensed) {
                res.status(409).json({ error: 'Prescription already dispensed' });
                return;
            }

            // Check expiry from token
            if (data.exp < Date.now()) {
                res.status(410).json({ error: 'Prescription QR has expired' });
                return;
            }

            res.json({
                valid: true,
                prescription: {
                    id: prescription.id,
                    patientId: prescription.patientId,
                    medicines: prescription.medicines.map(m => ({
                        medicineId: m.medicineId,
                        name: m.medicine.name,
                        dosage: m.dosage,
                        maxQty: m.quantity,
                        dispensed: m.dispensed,
                        days: 5
                    })),
                    issuedAt: prescription.createdAt,
                    verifiedAt: new Date().toISOString()
                }
            });
        } catch (error: any) {
            console.error('Prescription verification error:', error.message);
            res.status(401).json({
                valid: false,
                error: 'SECURITY_VIOLATION: Prescription QR is invalid, tampered, or fraudulent'
            });
        }
    }
);

/**
 * GET /api/prescriptions/my-prescriptions
 * Fetch all prescriptions for the currently authenticated patient
 */
router.get(
    '/my-prescriptions',
    authenticate,
    requireRole(UserRole.PATIENT),
    async (req: Request, res: Response) => {
        try {
            const patientId = req.user!.userId;

            const prescriptions = await prisma.prescription.findMany({
                where: { patientId },
                include: {
                    medicines: {
                        include: {
                            medicine: true
                        }
                    },
                    issuer: {
                        select: {
                            fullName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Map it to the format expected by the frontend
            const mapped = prescriptions.map(rx => ({
                id: rx.id,
                status: rx.dispensed ? 'completed' : 'issued',
                doctor: rx.issuer?.fullName || 'Unknown Doctor',
                specialty: 'General', // Not in schema, fallback
                hospital: 'PharmaLync Network', // Not in schema, fallback
                date: new Date(rx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                medicines: rx.medicines.map(m => ({
                    name: m.medicine.name,
                    dosage: m.dosage,
                    duration: 'N/A', // Not in schema
                    timing: 'As directed', // Not in schema
                    quantity: m.quantity,
                    dispensed: m.dispensed
                })),
                expiry: new Date(new Date(rx.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            }));

            res.json({ prescriptions: mapped });
        } catch (error) {
            console.error('Fetch my prescriptions error:', error);
            res.status(500).json({ error: 'Failed to fetch prescriptions' });
        }
    }
);

/**
 * GET /api/prescriptions/patient/:patientId
 * Fetch all prescriptions for a specific patient
 * Requires: DOCTOR, PHARMACIST, or ADMIN role
 */
router.get(
    '/patient/:patientId',
    authenticate,
    requireRole(UserRole.DOCTOR, UserRole.PHARMACIST, UserRole.ADMIN, UserRole.NURSE),
    async (req: Request, res: Response) => {
        try {
            const { patientId } = req.params;

            const prescriptions = await prisma.prescription.findMany({
                where: { patientId },
                include: {
                    medicines: {
                        include: {
                            medicine: true
                        }
                    },
                    issuer: {
                        select: {
                            fullName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Map it to the format expected by the frontend
            const mapped = prescriptions.map(rx => ({
                id: rx.id,
                status: rx.dispensed ? 'completed' : 'issued',
                doctor: rx.issuer?.fullName || 'Unknown Doctor',
                specialty: 'General', 
                hospital: 'PharmaLync Network',
                date: new Date(rx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                medicines: rx.medicines.map(m => ({
                    medicineId: m.medicineId,
                    name: m.medicine.name,
                    dosage: m.dosage,
                    maxQty: m.quantity, // Added so DispensePage logic works (medRx.maxQty)
                    dispensed: m.dispensed, // Real dispensed value
                    days: 5 // Mocked for now
                })),
                expiry: new Date(new Date(rx.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            }));

            res.json({ prescriptions: mapped });
        } catch (error) {
            console.error('Fetch patient prescriptions error:', error);
            res.status(500).json({ error: 'Failed to fetch prescriptions' });
        }
    }
);

/**
 * POST /api/prescriptions/dispense
 * Handle dispensing medicines (both prescription and OTC)
 * Requires: PHARMACIST role
 */
router.post(
    '/dispense',
    authenticate,
    requireRole(UserRole.PHARMACIST, UserRole.ADMIN),
    validateRequest(dispenseSchema),
    async (req: Request, res: Response) => {
        try {
            const { items } = req.body;
            const pharmacistId = req.user!.userId;

            // Start a transaction
            await prisma.$transaction(async (tx) => {
                for (const item of items) {
                    // 1. Find the medicine to deduct stock
                    const medicine = await tx.medicine.findUnique({ where: { id: item.id } });
                    
                    if (!medicine) {
                        // Skip mock items safely in demo mode
                        if (item.id.startsWith('MOCK-')) continue;
                        throw new Error(`Medicine ${item.id} not found.`);
                    }

                    if (medicine.stock < item.quantity) {
                        throw new Error(`Insufficient stock for ${medicine.name}.`);
                    }

                    // Deduct stock
                    await tx.medicine.update({
                        where: { id: item.id },
                        data: { stock: { decrement: item.quantity } }
                    });

                    // 2. If it's a prescription item, enforce limit and increment dispensed
                    if (item.prescriptionId) {
                        const rxMed = await tx.prescriptionMedicine.findUnique({
                            where: {
                                prescriptionId_medicineId: {
                                    prescriptionId: item.prescriptionId,
                                    medicineId: item.id
                                }
                            }
                        });

                        if (!rxMed) {
                            throw new Error(`Prescription medicine mapping not found.`);
                        }

                        const remaining = rxMed.quantity - rxMed.dispensed;
                        if (item.quantity > remaining) {
                            throw new Error(`Cannot dispense more than prescribed limit for ${medicine.name}.`);
                        }

                        // Increment dispensed
                        await tx.prescriptionMedicine.update({
                            where: { id: rxMed.id },
                            data: { dispensed: { increment: item.quantity } }
                        });

                        // Check if the entire prescription is completed
                        const allRxMeds = await tx.prescriptionMedicine.findMany({
                            where: { prescriptionId: item.prescriptionId }
                        });
                        
                        const isFullyDispensed = allRxMeds.every(m => {
                            // Because we just updated one, we must calculate the new value for this specific item
                            const currentDispensed = m.id === rxMed.id ? m.dispensed + item.quantity : m.dispensed;
                            return currentDispensed >= m.quantity;
                        });

                        if (isFullyDispensed) {
                            await tx.prescription.update({
                                where: { id: item.prescriptionId },
                                data: { 
                                    dispensed: true,
                                    dispensedAt: new Date(),
                                    dispensedBy: pharmacistId
                                }
                            });
                        }
                    }
                }
            });

            res.json({ success: true, message: 'Dispense successful' });
        } catch (error: any) {
            console.error('Dispense error:', error.message);
            res.status(400).json({ error: error.message || 'Dispense failed' });
        }
    }
);

export default router;
