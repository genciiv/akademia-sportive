-- CreateEnum
CREATE TYPE "InterAcademyMatchRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterAcademyMatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateTable
CREATE TABLE "InterAcademyMatchRequest" (
    "id" TEXT NOT NULL,
    "requesterAcademyId" TEXT NOT NULL,
    "requesterTeamId" TEXT NOT NULL,
    "opponentAcademyId" TEXT NOT NULL,
    "opponentTeamId" TEXT NOT NULL,
    "status" "InterAcademyMatchRequestStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "requesterIsHome" BOOLEAN NOT NULL DEFAULT true,
    "matchType" "MatchType" NOT NULL DEFAULT 'FRIENDLY',
    "competitionName" TEXT,
    "round" TEXT,
    "message" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterAcademyMatchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterAcademyMatch" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "homeAcademyId" TEXT NOT NULL,
    "awayAcademyId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeMatchId" TEXT NOT NULL,
    "awayMatchId" TEXT NOT NULL,
    "status" "InterAcademyMatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterAcademyMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_requesterAcademyId_idx" ON "InterAcademyMatchRequest"("requesterAcademyId");

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_opponentAcademyId_idx" ON "InterAcademyMatchRequest"("opponentAcademyId");

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_requesterTeamId_idx" ON "InterAcademyMatchRequest"("requesterTeamId");

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_opponentTeamId_idx" ON "InterAcademyMatchRequest"("opponentTeamId");

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_status_idx" ON "InterAcademyMatchRequest"("status");

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_startsAt_idx" ON "InterAcademyMatchRequest"("startsAt");

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_opponentAcademyId_status_idx" ON "InterAcademyMatchRequest"("opponentAcademyId", "status");

-- CreateIndex
CREATE INDEX "InterAcademyMatchRequest_requesterAcademyId_status_idx" ON "InterAcademyMatchRequest"("requesterAcademyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InterAcademyMatch_requestId_key" ON "InterAcademyMatch"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "InterAcademyMatch_homeMatchId_key" ON "InterAcademyMatch"("homeMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "InterAcademyMatch_awayMatchId_key" ON "InterAcademyMatch"("awayMatchId");

-- CreateIndex
CREATE INDEX "InterAcademyMatch_homeAcademyId_idx" ON "InterAcademyMatch"("homeAcademyId");

-- CreateIndex
CREATE INDEX "InterAcademyMatch_awayAcademyId_idx" ON "InterAcademyMatch"("awayAcademyId");

-- CreateIndex
CREATE INDEX "InterAcademyMatch_homeTeamId_idx" ON "InterAcademyMatch"("homeTeamId");

-- CreateIndex
CREATE INDEX "InterAcademyMatch_awayTeamId_idx" ON "InterAcademyMatch"("awayTeamId");

-- CreateIndex
CREATE INDEX "InterAcademyMatch_startsAt_idx" ON "InterAcademyMatch"("startsAt");

-- CreateIndex
CREATE INDEX "InterAcademyMatch_status_idx" ON "InterAcademyMatch"("status");

-- AddForeignKey
ALTER TABLE "InterAcademyMatchRequest" ADD CONSTRAINT "InterAcademyMatchRequest_requesterAcademyId_fkey" FOREIGN KEY ("requesterAcademyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatchRequest" ADD CONSTRAINT "InterAcademyMatchRequest_requesterTeamId_fkey" FOREIGN KEY ("requesterTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatchRequest" ADD CONSTRAINT "InterAcademyMatchRequest_opponentAcademyId_fkey" FOREIGN KEY ("opponentAcademyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatchRequest" ADD CONSTRAINT "InterAcademyMatchRequest_opponentTeamId_fkey" FOREIGN KEY ("opponentTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatchRequest" ADD CONSTRAINT "InterAcademyMatchRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatch" ADD CONSTRAINT "InterAcademyMatch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "InterAcademyMatchRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatch" ADD CONSTRAINT "InterAcademyMatch_homeAcademyId_fkey" FOREIGN KEY ("homeAcademyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatch" ADD CONSTRAINT "InterAcademyMatch_awayAcademyId_fkey" FOREIGN KEY ("awayAcademyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatch" ADD CONSTRAINT "InterAcademyMatch_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatch" ADD CONSTRAINT "InterAcademyMatch_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatch" ADD CONSTRAINT "InterAcademyMatch_homeMatchId_fkey" FOREIGN KEY ("homeMatchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterAcademyMatch" ADD CONSTRAINT "InterAcademyMatch_awayMatchId_fkey" FOREIGN KEY ("awayMatchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

