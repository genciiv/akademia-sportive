/*
  Warnings:

  - A unique constraint covering the columns `[membershipId]` on the table `Coach` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "membershipId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Coach_membershipId_key" ON "Coach"("membershipId");

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "AcademyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
