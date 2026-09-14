/*
  Warnings:

  - A unique constraint covering the columns `[staffId]` on the table `Coach` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AcademyStaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LEFT');

-- AlterTable
ALTER TABLE "AcademyInvitation" ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "staffId" TEXT;

-- CreateTable
CREATE TABLE "AcademyStaff" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "AcademyRole" NOT NULL,
    "status" "AcademyStaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "membershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademyStaff_membershipId_key" ON "AcademyStaff"("membershipId");

-- CreateIndex
CREATE INDEX "AcademyStaff_academyId_idx" ON "AcademyStaff"("academyId");

-- CreateIndex
CREATE INDEX "AcademyStaff_academyId_role_idx" ON "AcademyStaff"("academyId", "role");

-- CreateIndex
CREATE INDEX "AcademyStaff_academyId_status_idx" ON "AcademyStaff"("academyId", "status");

-- CreateIndex
CREATE INDEX "AcademyStaff_academyId_email_idx" ON "AcademyStaff"("academyId", "email");

-- CreateIndex
CREATE INDEX "AcademyInvitation_staffId_idx" ON "AcademyInvitation"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_staffId_key" ON "Coach"("staffId");

-- AddForeignKey
ALTER TABLE "AcademyStaff" ADD CONSTRAINT "AcademyStaff_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyStaff" ADD CONSTRAINT "AcademyStaff_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "AcademyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyInvitation" ADD CONSTRAINT "AcademyInvitation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "AcademyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "AcademyStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
