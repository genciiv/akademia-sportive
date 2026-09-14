/*
  Warnings:

  - A unique constraint covering the columns `[academyId,email]` on the table `AcademyStaff` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AcademyStaff_academyId_email_idx";

-- CreateIndex
CREATE UNIQUE INDEX "AcademyStaff_academyId_email_key" ON "AcademyStaff"("academyId", "email");
