-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "facilityId" TEXT;

-- AlterTable
ALTER TABLE "TrainingSession" ADD COLUMN     "facilityId" TEXT;

-- CreateIndex
CREATE INDEX "Match_facilityId_idx" ON "Match"("facilityId");

-- CreateIndex
CREATE INDEX "Match_academyId_facilityId_startsAt_idx" ON "Match"("academyId", "facilityId", "startsAt");

-- CreateIndex
CREATE INDEX "TrainingSession_facilityId_idx" ON "TrainingSession"("facilityId");

-- CreateIndex
CREATE INDEX "TrainingSession_academyId_facilityId_startsAt_idx" ON "TrainingSession"("academyId", "facilityId", "startsAt");

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
