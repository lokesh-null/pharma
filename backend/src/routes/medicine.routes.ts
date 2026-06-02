import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../middleware/auth.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { validateRequest } from '../middleware/security.middleware';
import { getBlockchainService } from '../services/blockchain.service';
import { getQrSecurityService } from '../services/qr-security.service';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();
const blockchainService = getBlockchainService();
const qrSecurityService = getQrSecurityService();

/**
 * Validation schemas
 */
const registerMedicineSchema = {
    body: Joi.object({
        name: Joi.string().required(),
        manufacturer: Joi.string().required(),
        batchNumber: Joi.string().required()
    })
};

/**
 * POST /api/medicines
 * Register medicine on blockchain
 * Requires: PHARMACY or ADMIN role
 */
router.post(
    '/',
    authenticate,
    requireRole(UserRole.PHARMACY, UserRole.ADMIN),
    validateRequest(registerMedicineSchema),
    async (req: Request, res: Response) => {
        try {
            const { name, manufacturer, batchNumber } = req.body;

            // Check if medicine already exists
            const existing = await prisma.medicine.findUnique({
                where: { batchNumber }
            });

            if (existing) {
                res.status(409).json({ error: 'Medicine with this batch number already exists' });
                return;
            }

            // Register on blockchain
            const { medicineId, txHash } = await blockchainService.registerMedicine(
                name,
                manufacturer,
                batchNumber
            );

            // Save to database
            const medicine = await prisma.medicine.create({
                data: {
                    name,
                    manufacturer,
                    batchNumber,
                    blockchainId: medicineId,
                    verified: true
                }
            });

            res.status(201).json({
                message: 'Medicine registered successfully',
                medicine: {
                    id: medicine.id,
                    name: medicine.name,
                    manufacturer: medicine.manufacturer,
                    batchNumber: medicine.batchNumber,
                    blockchainId: medicine.blockchainId,
                    txHash
                }
            });
        } catch (error) {
            console.error('Register medicine error:', error);
            res.status(500).json({ error: 'Failed to register medicine' });
        }
    }
);

/**
 * GET /api/medicines/:id
 * Get medicine details
 * Requires: Authentication
 */
router.get(
    '/:id',
    authenticate,
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const medicine = await prisma.medicine.findUnique({
                where: { id }
            });

            if (!medicine) {
                res.status(404).json({ error: 'Medicine not found' });
                return;
            }

            res.json({ medicine });
        } catch (error) {
            console.error('Get medicine error:', error);
            res.status(500).json({ error: 'Failed to retrieve medicine' });
        }
    }
);

/**
 * POST /api/medicines/:id/dispense
 * Dispense medicine (with double-dispensing check)
 * Requires: PHARMACY role
 */
router.post(
    '/:id/dispense',
    authenticate,
    requireRole(UserRole.PHARMACY),
    auditLog('MEDICINE_DISPENSE', 'medicine'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const medicine = await prisma.medicine.findUnique({
                where: { id }
            });

            if (!medicine) {
                res.status(404).json({ error: 'Medicine not found' });
                return;
            }

            if (!medicine.blockchainId) {
                res.status(400).json({ error: 'Medicine not registered on blockchain' });
                return;
            }

            // Check if already dispensed on blockchain
            const isDispensed = await blockchainService.isMedicineDispensed(medicine.blockchainId);

            if (isDispensed) {
                res.status(409).json({ error: 'Medicine already dispensed' });
                return;
            }

            // Dispense on blockchain
            const txHash = await blockchainService.dispenseMedicine(medicine.blockchainId);

            res.json({
                message: 'Medicine dispensed successfully',
                txHash
            });
        } catch (error) {
            console.error('Dispense medicine error:', error);
            res.status(500).json({ error: 'Failed to dispense medicine' });
        }
    }
);

/**
 * GET /api/medicines
 * List all medicines
 * Requires: Authentication
 */
router.get(
    '/',
    authenticate,
    async (_req: Request, res: Response) => {
        try {
            const medicines = await prisma.medicine.findMany({
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            res.json({ medicines });
        } catch (error) {
            console.error('List medicines error:', error);
            res.status(500).json({ error: 'Failed to list medicines' });
        }
    }
);

/**
 * GET /api/medicines/:id/qr
 * Generate a secure, non-reversible QR token for a medicine
 * Requires: ADMIN or PHARMACY role
 */
router.get(
    '/:id/qr',
    authenticate,
    requireRole(UserRole.ADMIN, UserRole.PHARMACY),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const medicine = await prisma.medicine.findUnique({
                where: { id }
            });

            if (!medicine) {
                res.status(404).json({ error: 'Medicine not found' });
                return;
            }

            // Generate secure token with metadata
            const qrToken = qrSecurityService.generateSecureToken({
                medicineId: medicine.id,
                batchNumber: medicine.batchNumber,
                blockchainId: medicine.blockchainId
            }, 'MEDICINE');

            res.json({
                qrToken,
                note: 'This token is cryptographically signed and encrypted. It cannot be reversed to its original data without the master key.'
            });
        } catch (error) {
            console.error('QR generation error:', error);
            res.status(500).json({ error: 'Failed to generate secure QR' });
        }
    }
);

/**
 * POST /api/medicines/verify-qr
 * Verify a scanned QR token
 * Returns decrypted medicine details if valid and untampered
 */
router.post(
    '/verify-qr',
    authenticate,
    async (req: Request, res: Response) => {
        try {
            const { qrToken } = req.body;

            if (!qrToken) {
                res.status(400).json({ error: 'QR token is required' });
                return;
            }

            // Verify and decrypt token
            const data = qrSecurityService.verifyToken(qrToken, 'MEDICINE');

            // Fetch current state from DB
            const medicine = await prisma.medicine.findUnique({
                where: { id: data.medicineId }
            });

            if (!medicine) {
                res.status(404).json({ error: 'Medicine record not found' });
                return;
            }

            // Verify against blockchain state for double-dispensing
            let blockchainStatus = 'NOT_REGISTERED';
            if (medicine.blockchainId) {
                const isDispensed = await blockchainService.isMedicineDispensed(medicine.blockchainId);
                blockchainStatus = isDispensed ? 'DISPENSED' : 'READY';
            }

            res.json({
                valid: true,
                medicine: {
                    id: medicine.id,
                    name: medicine.name,
                    batchNumber: medicine.batchNumber,
                    blockchainStatus,
                    verifiedAt: new Date().toISOString()
                }
            });
        } catch (error: any) {
            console.error('QR verification error:', error.message);
            res.status(401).json({
                valid: false,
                error: 'SECURITY_VIOLATION: Invalid or tampered QR code scanned'
            });
        }
    }
);

export default router;
