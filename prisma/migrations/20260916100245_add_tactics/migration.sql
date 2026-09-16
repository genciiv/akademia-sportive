-- CreateEnum
CREATE TYPE "TacticPhase" AS ENUM ('ATTACK', 'DEFENSE', 'ATTACK_TRANSITION', 'DEFENSE_TRANSITION', 'SET_PIECE');

-- CreateTable
CREATE TABLE "Tactic" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "teamId" TEXT,
    "name" TEXT NOT NULL,
    "formation" TEXT,
    "phase" "TacticPhase" NOT NULL DEFAULT 'ATTACK',
    "sport" TEXT,
    "objective" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "boardData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tactic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tactic_academyId_idx" ON "Tactic"("academyId");

-- CreateIndex
CREATE INDEX "Tactic_academyId_isActive_idx" ON "Tactic"("academyId", "isActive");

-- CreateIndex
CREATE INDEX "Tactic_academyId_phase_idx" ON "Tactic"("academyId", "phase");

-- CreateIndex
CREATE INDEX "Tactic_teamId_idx" ON "Tactic"("teamId");

-- AddForeignKey
ALTER TABLE "Tactic" ADD CONSTRAINT "Tactic_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tactic" ADD CONSTRAINT "Tactic_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
