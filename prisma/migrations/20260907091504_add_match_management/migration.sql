-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('FRIENDLY', 'LEAGUE', 'CUP', 'TOURNAMENT', 'OTHER');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "matchType" "MatchType" NOT NULL DEFAULT 'FRIENDLY',
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isHome" BOOLEAN NOT NULL DEFAULT true,
    "ourScore" INTEGER,
    "opponentScore" INTEGER,
    "competitionName" TEXT,
    "round" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_academyId_idx" ON "Match"("academyId");

-- CreateIndex
CREATE INDEX "Match_academyId_startsAt_idx" ON "Match"("academyId", "startsAt");

-- CreateIndex
CREATE INDEX "Match_academyId_status_idx" ON "Match"("academyId", "status");

-- CreateIndex
CREATE INDEX "Match_teamId_idx" ON "Match"("teamId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
