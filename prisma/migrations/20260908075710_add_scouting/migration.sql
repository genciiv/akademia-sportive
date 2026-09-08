-- CreateEnum
CREATE TYPE "ScoutingStatus" AS ENUM ('NEW', 'OBSERVING', 'SHORTLISTED', 'TRIAL', 'REJECTED', 'SIGNED');

-- CreateEnum
CREATE TYPE "ScoutingPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "ScoutingCandidate" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender" NOT NULL DEFAULT 'NOT_SPECIFIED',
    "sport" "SportType" NOT NULL,
    "position" TEXT,
    "currentClub" TEXT,
    "nationality" TEXT,
    "city" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "photo" TEXT,
    "status" "ScoutingStatus" NOT NULL DEFAULT 'NEW',
    "priority" "ScoutingPriority" NOT NULL DEFAULT 'MEDIUM',
    "technicalRating" DECIMAL(65,30),
    "physicalRating" DECIMAL(65,30),
    "tacticalRating" DECIMAL(65,30),
    "mentalRating" DECIMAL(65,30),
    "overallRating" DECIMAL(65,30),
    "strengths" TEXT,
    "weaknesses" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutingCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoutingObservation" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventName" TEXT,
    "location" TEXT,
    "observerName" TEXT,
    "technicalRating" DECIMAL(65,30),
    "physicalRating" DECIMAL(65,30),
    "tacticalRating" DECIMAL(65,30),
    "mentalRating" DECIMAL(65,30),
    "overallRating" DECIMAL(65,30),
    "strengths" TEXT,
    "weaknesses" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutingObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoutingCandidate_academyId_idx" ON "ScoutingCandidate"("academyId");

-- CreateIndex
CREATE INDEX "ScoutingCandidate_academyId_status_idx" ON "ScoutingCandidate"("academyId", "status");

-- CreateIndex
CREATE INDEX "ScoutingCandidate_academyId_priority_idx" ON "ScoutingCandidate"("academyId", "priority");

-- CreateIndex
CREATE INDEX "ScoutingCandidate_academyId_sport_idx" ON "ScoutingCandidate"("academyId", "sport");

-- CreateIndex
CREATE INDEX "ScoutingCandidate_academyId_lastName_firstName_idx" ON "ScoutingCandidate"("academyId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "ScoutingObservation_candidateId_idx" ON "ScoutingObservation"("candidateId");

-- CreateIndex
CREATE INDEX "ScoutingObservation_candidateId_observedAt_idx" ON "ScoutingObservation"("candidateId", "observedAt");

-- AddForeignKey
ALTER TABLE "ScoutingCandidate" ADD CONSTRAINT "ScoutingCandidate_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutingObservation" ADD CONSTRAINT "ScoutingObservation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ScoutingCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
