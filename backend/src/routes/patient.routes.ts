import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../middleware/auth.middleware';
import { ConsentScope } from '../services/consent.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { requirePatientConsent } from '../middleware/consent.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { validateRequest } from '../middleware/security.middleware';
import { getAadhaarService } from '../services/aadhaar.service';
import { getEncryptionService } from '../services/encryption.service';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();
const aadhaarService = getAadhaarService();
const encryptionService = getEncryptionService();

/**
 * Validation schemas
 */
const createPatientSchema = {
    body: Joi.object({
        aadhaar: Joi.string().pattern(/^\d{12}$/).required(),
        name: Joi.string().required(),
        dob: Joi.string().isoDate().optional(),
        phone: Joi.string().pattern(/^\d{10}$/).optional(),
        address: Joi.string().optional(),
        consentGiven: Joi.boolean().required()
    })
};

const updatePatientSchema = {
    body: Joi.object({
        name: Joi.string().optional(),
        dob: Joi.string().isoDate().optional(),
        phone: Joi.string().pattern(/^\d{10}$/).optional(),
        address: Joi.string().optional(),
        consentGiven: Joi.boolean().optional()
    })
};

/**
 * POST /api/patients
 */
router.post(
    '/',
    authenticate,
    requireRole(UserRole.ADMIN),
    validateRequest(createPatientSchema),
    auditLog('CREATE_PATIENT', 'patient'),
    async (req: Request, res: Response) => {
        try {
            const { aadhaar, name, dob, phone, address, consentGiven } = req.body;
            const aadhaarHash = aadhaarService.hashAadhaar(aadhaar);
            const existingPatient = await prisma.patient.findUnique({
                where: { aadhaarHash }
            });

            if (existingPatient) {
                res.status(409).json({ error: 'Patient with this Aadhaar already exists' });
                return;
            }

            const { encrypted: aadhaarEncrypted, hash } = aadhaarService.encryptForStorage(aadhaar);
            const nameEncrypted = encryptionService.encryptPII(name);
            const dobEncrypted = dob ? encryptionService.encryptPII(dob) : undefined;
            const phoneEncrypted = phone ? encryptionService.encryptPII(phone) : undefined;
            const phoneHash = phone ? encryptionService.hash(phone) : undefined;
            const addressEncrypted = address ? encryptionService.encryptPII(address) : undefined;

            const patient = await prisma.patient.create({
                data: {
                    aadhaarEncrypted,
                    aadhaarHash: hash,
                    nameEncrypted,
                    dobEncrypted,
                    phoneEncrypted,
                    phoneHash,
                    addressEncrypted,
                    consentGiven
                }
            });

            res.status(201).json({
                message: 'Patient created successfully',
                patient: {
                    id: patient.id,
                    consentGiven: patient.consentGiven,
                    createdAt: patient.createdAt
                }
            });
        } catch (error) {
            console.error('Create patient error:', error);
            res.status(500).json({ error: 'Failed to create patient' });
        }
    }
);

/**
 * GET /api/patients/:id
 */
router.get(
    '/:id',
    authenticate,
    requireRole(UserRole.ADMIN, UserRole.DOCTOR),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const patient = await prisma.patient.findUnique({
                where: { id }
            });

            if (!patient) {
                res.status(404).json({ error: 'Patient not found' });
                return;
            }

            const name = encryptionService.decryptPII(patient.nameEncrypted);
            const dob = patient.dobEncrypted ? encryptionService.decryptPII(patient.dobEncrypted) : null;
            const phone = patient.phoneEncrypted ? encryptionService.decryptPII(patient.phoneEncrypted) : null;
            const address = patient.addressEncrypted ? encryptionService.decryptPII(patient.addressEncrypted) : null;

            res.json({
                id: patient.id,
                name,
                dob,
                phone,
                address,
                aadhaar: 'XXXX-XXXX-****',
                consentGiven: patient.consentGiven,
                createdAt: patient.createdAt,
                updatedAt: patient.updatedAt
            });
        } catch (error) {
            console.error('Get patient error:', error);
            res.status(500).json({ error: 'Failed to retrieve patient' });
        }
    }
);

/**
 * GET /api/patients/:id/aadhaar
 */
router.get(
    '/:id/aadhaar',
    authenticate,
    requirePatientConsent(ConsentScope.VIEW_AADHAAR),
    auditLog('VIEW_AADHAAR', 'patient'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const patient = await prisma.patient.findUnique({
                where: { id },
                select: { aadhaarEncrypted: true }
            });

            if (!patient) {
                res.status(404).json({ error: 'Patient not found' });
                return;
            }

            const aadhaarToken = aadhaarService.decryptAadhaar(patient.aadhaarEncrypted);
            res.json({
                message: 'Aadhaar access granted',
                aadhaarToken,
                note: 'This is a tokenized representation.'
            });
        } catch (error) {
            console.error('View Aadhaar error:', error);
            res.status(500).json({ error: 'Failed to retrieve Aadhaar' });
        }
    }
);

/**
 * PUT /api/patients/:id
 */
router.put(
    '/:id',
    authenticate,
    requireRole(UserRole.ADMIN),
    validateRequest(updatePatientSchema),
    auditLog('UPDATE_PATIENT', 'patient'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, dob, phone, address, consentGiven } = req.body;
            const existingPatient = await prisma.patient.findUnique({ where: { id } });

            if (!existingPatient) {
                res.status(404).json({ error: 'Patient not found' });
                return;
            }

            const updateData: any = {};
            if (name) updateData.nameEncrypted = encryptionService.encryptPII(name);
            if (dob) updateData.dobEncrypted = encryptionService.encryptPII(dob);
            if (phone) {
                updateData.phoneEncrypted = encryptionService.encryptPII(phone);
                updateData.phoneHash = encryptionService.hash(phone);
            }
            if (address) updateData.addressEncrypted = encryptionService.encryptPII(address);
            if (consentGiven !== undefined) updateData.consentGiven = consentGiven;

            const patient = await prisma.patient.update({
                where: { id },
                data: updateData
            });

            res.json({
                message: 'Patient updated successfully',
                patient: { id: patient.id, updatedAt: patient.updatedAt }
            });
        } catch (error) {
            console.error('Update patient error:', error);
            res.status(500).json({ error: 'Failed to update patient' });
        }
    }
);

/**
 * DELETE /api/patients/:id
 */
router.delete(
    '/:id',
    authenticate,
    requireRole(UserRole.ADMIN),
    auditLog('DELETE_PATIENT', 'patient'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await prisma.patient.delete({ where: { id } });
            res.json({ message: 'Patient deleted successfully' });
        } catch (error) {
            console.error('Delete patient error:', error);
            res.status(500).json({ error: 'Failed to delete patient' });
        }
    }
);

/**
 * GET /api/patients
 */
router.get(
    '/',
    authenticate,
    requireRole(UserRole.ADMIN, UserRole.DOCTOR),
    async (_req: Request, res: Response) => {
        try {
            const patients = await prisma.patient.findMany({
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            const decryptedPatients = patients.map(patient => ({
                id: patient.id,
                name: encryptionService.decryptPII(patient.nameEncrypted),
                aadhaar: 'XXXX-XXXX-****',
                consentGiven: patient.consentGiven,
                createdAt: patient.createdAt
            }));

            res.json({ patients: decryptedPatients });
        } catch (error) {
            console.error('List patients error:', error);
            res.status(500).json({ error: 'Failed to list patients' });
        }
    }
);

export default router;
