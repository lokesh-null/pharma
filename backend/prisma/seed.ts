import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Hash password using PBKDF2-SHA512 (same as auth.service.ts)
 */
function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16);
        crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
        });
    });
}

/**
 * Simple AES-256-GCM encryption for PII seeding
 */
function encryptPII(value: string): Buffer {
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(value, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: [IV(12) | Tag(16) | Ciphertext]
    return Buffer.concat([iv, tag, encrypted]);
}

async function seed() {
    console.log('🌱 Seeding PharmaLync database...\n');

    // --- 1. Create Users ---
    const adminPassword = await hashPassword('admin123');
    const nursePassword = await hashPassword('nurse123');
    const pharmacyPassword = await hashPassword('pharmacy123');

    const admin = await prisma.user.upsert({
        where: { email: 'dr.sharma@pharmalync.in' },
        update: {},
        create: {
            email: 'dr.sharma@pharmalync.in',
            passwordHash: adminPassword,
            role: 'ADMIN',
            name: 'Dr. A. Sharma',
        }
    });
    console.log(`✓ Admin/Doctor: ${admin.email} (password: admin123)`);

    const nurse = await prisma.user.upsert({
        where: { email: 'nurse.priya@pharmalync.in' },
        update: {},
        create: {
            email: 'nurse.priya@pharmalync.in',
            passwordHash: nursePassword,
            role: 'NURSE',
            name: 'Nurse Priya',
        }
    });
    console.log(`✓ Nurse: ${nurse.email} (password: nurse123)`);

    const pharmacist = await prisma.user.upsert({
        where: { email: 'pharmacy@pharmalync.in' },
        update: {},
        create: {
            email: 'pharmacy@pharmalync.in',
            passwordHash: pharmacyPassword,
            role: 'PHARMACY',
            name: 'MedPlus Pharmacy',
        }
    });
    console.log(`✓ Pharmacist: ${pharmacist.email} (password: pharmacy123)`);

    // --- 2. Create Patient ---
    const aadhaarRaw = '123456789012';
    const aadhaarHash = crypto.createHash('sha256').update(aadhaarRaw).digest('hex');

    const patient = await prisma.patient.upsert({
        where: { aadhaarHash },
        update: {},
        create: {
            aadhaarEncrypted: encryptPII(aadhaarRaw),
            aadhaarHash,
            nameEncrypted: encryptPII('Harish Kumar'),
            dobEncrypted: encryptPII('1981-03-15'),
            phoneEncrypted: encryptPII('9876543210'),
            addressEncrypted: encryptPII('42, MG Road, Bangalore 560001'),
            consentGiven: true,
        }
    });
    console.log(`✓ Patient: Harish Kumar (id: ${patient.id})`);

    // Create second patient
    const aadhaar2 = '987654321098';
    const aadhaarHash2 = crypto.createHash('sha256').update(aadhaar2).digest('hex');
    const patient2 = await prisma.patient.upsert({
        where: { aadhaarHash: aadhaarHash2 },
        update: {},
        create: {
            aadhaarEncrypted: encryptPII(aadhaar2),
            aadhaarHash: aadhaarHash2,
            nameEncrypted: encryptPII('Priya Singh'),
            dobEncrypted: encryptPII('1998-07-22'),
            phoneEncrypted: encryptPII('9876541122'),
            consentGiven: true,
        }
    });
    console.log(`✓ Patient: Priya Singh (id: ${patient2.id})`);

    // --- 3. Create Medicines ---
    const medicines = [
        { name: 'Paracetamol 500mg', manufacturer: 'Cipla', batchNumber: 'CIP-PCM-2024-001', stock: 120, price: 2, category: 'Pain Relief' },
        { name: 'Dolo 650', manufacturer: 'Micro Labs', batchNumber: 'ML-DL650-2024-002', stock: 45, price: 3, category: 'Fever' },
        { name: 'Augmentin 625', manufacturer: 'GSK', batchNumber: 'GSK-AUG-2024-003', stock: 15, price: 22, category: 'Antibiotic' },
        { name: 'Cetirizine 10mg', manufacturer: 'Dr Reddy', batchNumber: 'DRL-CTZ-2024-004', stock: 200, price: 5, category: 'Allergy' },
        { name: 'Pantop 40', manufacturer: 'Aristo', batchNumber: 'ARI-PAN-2024-005', stock: 80, price: 12, category: 'Gastritis' },
        { name: 'Azithromycin 500', manufacturer: 'Cipla', batchNumber: 'CIP-AZI-2024-006', stock: 12, price: 18, category: 'Antibiotic' },
        { name: 'Cough Syrup 100ml', manufacturer: 'Dabur', batchNumber: 'DAB-CS-2024-007', stock: 5, price: 95, category: 'Syrup' },
        { name: 'Montelukast 10mg', manufacturer: 'Sun Pharma', batchNumber: 'SUN-MTK-2024-008', stock: 60, price: 8, category: 'Respiratory' },
        { name: 'Amoxicillin 500mg', manufacturer: 'Cipla', batchNumber: 'CIP-AMX-2024-009', stock: 90, price: 7, category: 'Antibiotic' },
        { name: 'Omeprazole 20mg', manufacturer: 'Dr Reddy', batchNumber: 'DRL-OME-2024-010', stock: 110, price: 6, category: 'Gastritis' },
    ];

    for (const med of medicines) {
        await prisma.medicine.upsert({
            where: { batchNumber: med.batchNumber },
            update: { stock: med.stock, price: med.price },
            create: {
                name: med.name,
                manufacturer: med.manufacturer,
                batchNumber: med.batchNumber,
                stock: med.stock,
                price: med.price,
                category: med.category,
                verified: true,
            }
        });
    }
    console.log(`✓ Medicines: ${medicines.length} items seeded`);

    // --- 4. Create a Sample Prescription ---
    const allMeds = await prisma.medicine.findMany();
    const augmentin = allMeds.find(m => m.name.includes('Augmentin'));
    const dolo = allMeds.find(m => m.name.includes('Dolo'));

    if (augmentin && dolo) {
        const prescription = await prisma.prescription.create({
            data: {
                patientId: patient.id,
                issuedBy: admin.id,
                diagnosis: 'Upper Respiratory Tract Infection',
                notes: 'Take medicines after food. Revisit after 5 days if symptoms persist.',
                medicines: {
                    create: [
                        { medicineId: augmentin.id, quantity: 10, dosage: '1-0-1 (After food)' },
                        { medicineId: dolo.id, quantity: 6, dosage: '1-0-1 (SOS for fever)' },
                    ]
                }
            }
        });
        console.log(`✓ Prescription: ${prescription.id} (for Harish Kumar)`);
    }

    // --- 5. Create Audit Logs ---
    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: 'CREATE_PATIENT',
            resourceType: 'patient',
            resourceId: patient.id,
            metadata: JSON.stringify({ method: 'POST', path: '/api/patients' }),
        }
    });

    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: 'PRESCRIPTION_CREATE',
            resourceType: 'prescription',
            metadata: JSON.stringify({ method: 'POST', path: '/api/prescriptions' }),
        }
    });
    console.log('✓ Audit logs: 2 sample entries created');

    console.log('\n✅ Seed complete!\n');
    console.log('Login credentials:');
    console.log('  Doctor:     dr.sharma@pharmalync.in / admin123');
    console.log('  Nurse:      nurse.priya@pharmalync.in / nurse123');
    console.log('  Pharmacist: pharmacy@pharmalync.in / pharmacy123');
}

seed()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
