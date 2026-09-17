-- CreateEnum
CREATE TYPE "MedicalRecordType" AS ENUM ('INJURY', 'ILLNESS', 'CHECKUP', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalRecordStatus" AS ENUM ('ACTIVE', 'RECOVERING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MedicalAvailability" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "PlayerMedicalRecord" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" "MedicalRecordType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "MedicalRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "availability" "MedicalAvailability" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expectedReturnAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "description" TEXT,
    "restrictions" TEXT,
    "recoveryNotes" TEXT,
    "privateNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerMedicalRecord_playerId_startedAt_idx" ON "PlayerMedicalRecord"("playerId", "startedAt");

-- CreateIndex
CREATE INDEX "PlayerMedicalRecord_playerId_status_idx" ON "PlayerMedicalRecord"("playerId", "status");

-- CreateIndex
CREATE INDEX "PlayerMedicalRecord_playerId_availability_idx" ON "PlayerMedicalRecord"("playerId", "availability");

-- AddForeignKey
ALTER TABLE "PlayerMedicalRecord" ADD CONSTRAINT "PlayerMedicalRecord_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
