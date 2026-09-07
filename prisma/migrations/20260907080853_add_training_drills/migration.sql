-- CreateEnum
CREATE TYPE "DrillDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "Drill" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "sport" TEXT,
    "objective" TEXT,
    "durationMin" INTEGER,
    "difficulty" "DrillDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "equipment" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Drill_academyId_idx" ON "Drill"("academyId");

-- CreateIndex
CREATE INDEX "Drill_academyId_isActive_idx" ON "Drill"("academyId", "isActive");

-- CreateIndex
CREATE INDEX "Drill_academyId_category_idx" ON "Drill"("academyId", "category");

-- CreateIndex
CREATE INDEX "Drill_academyId_sport_idx" ON "Drill"("academyId", "sport");

-- CreateIndex
CREATE INDEX "Drill_academyId_name_idx" ON "Drill"("academyId", "name");

-- AddForeignKey
ALTER TABLE "Drill" ADD CONSTRAINT "Drill_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
