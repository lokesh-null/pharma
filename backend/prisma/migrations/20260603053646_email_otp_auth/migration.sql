-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "role" TEXT NOT NULL,
    "profilePicture" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aadhaarEncrypted" BLOB NOT NULL,
    "aadhaarHash" TEXT NOT NULL,
    "nameEncrypted" BLOB NOT NULL,
    "dobEncrypted" BLOB,
    "phoneEncrypted" BLOB,
    "phoneHash" TEXT,
    "addressEncrypted" BLOB,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "grantedTo" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Consent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Consent_grantedTo_fkey" FOREIGN KEY ("grantedTo") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockchainTxHash" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "blockchainId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'General',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "qrToken" TEXT,
    "dispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" DATETIME,
    "dispensedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prescription_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrescriptionMedicine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dosage" TEXT NOT NULL,
    CONSTRAINT "PrescriptionMedicine_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrescriptionMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_aadhaarHash_key" ON "Patient"("aadhaarHash");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phoneHash_key" ON "Patient"("phoneHash");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_batchNumber_key" ON "Medicine"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_blockchainId_key" ON "Medicine"("blockchainId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionMedicine_prescriptionId_medicineId_key" ON "PrescriptionMedicine"("prescriptionId", "medicineId");
