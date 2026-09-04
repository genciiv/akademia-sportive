-- CreateEnum
CREATE TYPE "CoachStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "TrainingSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "photo" TEXT,
    "specialization" TEXT,
    "license" TEXT,
    "notes" TEXT,
    "status" "CoachStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachTeam" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isHeadCoach" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "coachId" TEXT,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "status" "TrainingSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Coach_academyId_idx" ON "Coach"("academyId");

-- CreateIndex
CREATE INDEX "Coach_academyId_status_idx" ON "Coach"("academyId", "status");

-- CreateIndex
CREATE INDEX "Coach_academyId_lastName_firstName_idx" ON "Coach"("academyId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "CoachTeam_coachId_idx" ON "CoachTeam"("coachId");

-- CreateIndex
CREATE INDEX "CoachTeam_teamId_idx" ON "CoachTeam"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachTeam_coachId_teamId_key" ON "CoachTeam"("coachId", "teamId");

-- CreateIndex
CREATE INDEX "TrainingSession_academyId_idx" ON "TrainingSession"("academyId");

-- CreateIndex
CREATE INDEX "TrainingSession_teamId_idx" ON "TrainingSession"("teamId");

-- CreateIndex
CREATE INDEX "TrainingSession_coachId_idx" ON "TrainingSession"("coachId");

-- CreateIndex
CREATE INDEX "TrainingSession_branchId_idx" ON "TrainingSession"("branchId");

-- CreateIndex
CREATE INDEX "TrainingSession_academyId_startsAt_idx" ON "TrainingSession"("academyId", "startsAt");

-- CreateIndex
CREATE INDEX "TrainingSession_academyId_status_idx" ON "TrainingSession"("academyId", "status");

-- CreateIndex
CREATE INDEX "TrainingAttendance_trainingSessionId_idx" ON "TrainingAttendance"("trainingSessionId");

-- CreateIndex
CREATE INDEX "TrainingAttendance_playerId_idx" ON "TrainingAttendance"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_trainingSessionId_playerId_key" ON "TrainingAttendance"("trainingSessionId", "playerId");

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachTeam" ADD CONSTRAINT "CoachTeam_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachTeam" ADD CONSTRAINT "CoachTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "AcademyBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
