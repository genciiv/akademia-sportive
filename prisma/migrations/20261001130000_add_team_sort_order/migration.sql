-- AlterTable
ALTER TABLE "Team"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Team_academyId_sortOrder_idx"
ON "Team"("academyId", "sortOrder");