-- CreateTable
CREATE TABLE "PlayerMatchPerformance" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "shotsOnTarget" INTEGER NOT NULL DEFAULT 0,
    "passesAttempted" INTEGER NOT NULL DEFAULT 0,
    "passesCompleted" INTEGER NOT NULL DEFAULT 0,
    "dribblesAttempted" INTEGER NOT NULL DEFAULT 0,
    "dribblesCompleted" INTEGER NOT NULL DEFAULT 0,
    "duelsWon" INTEGER NOT NULL DEFAULT 0,
    "tackles" INTEGER NOT NULL DEFAULT 0,
    "interceptions" INTEGER NOT NULL DEFAULT 0,
    "foulsCommitted" INTEGER NOT NULL DEFAULT 0,
    "foulsWon" INTEGER NOT NULL DEFAULT 0,
    "coachRating" DECIMAL(65,30),
    "coachNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMatchPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerMatchPerformance_matchId_idx" ON "PlayerMatchPerformance"("matchId");

-- CreateIndex
CREATE INDEX "PlayerMatchPerformance_playerId_idx" ON "PlayerMatchPerformance"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchPerformance_matchId_playerId_key" ON "PlayerMatchPerformance"("matchId", "playerId");

-- AddForeignKey
ALTER TABLE "PlayerMatchPerformance" ADD CONSTRAINT "PlayerMatchPerformance_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchPerformance" ADD CONSTRAINT "PlayerMatchPerformance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
