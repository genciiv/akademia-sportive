-- Match lineup / formation foundation

ALTER TABLE "Match"
ADD COLUMN "lineupFormation" TEXT,
ADD COLUMN "lineupPublishedAt" TIMESTAMP(3);

ALTER TABLE "MatchPlayer"
ADD COLUMN "lineupSlot" TEXT;

CREATE INDEX "MatchPlayer_matchId_lineupSlot_idx"
ON "MatchPlayer"("matchId", "lineupSlot");
