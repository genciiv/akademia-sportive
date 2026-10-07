-- CreateTable
CREATE TABLE "TacticTeam" (
    "tacticId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TacticTeam_pkey" PRIMARY KEY ("tacticId","teamId")
);

-- CreateIndex
CREATE INDEX "TacticTeam_teamId_idx" ON "TacticTeam"("teamId");

-- AddForeignKey
ALTER TABLE "TacticTeam"
ADD CONSTRAINT "TacticTeam_tacticId_fkey"
FOREIGN KEY ("tacticId")
REFERENCES "Tactic"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacticTeam"
ADD CONSTRAINT "TacticTeam_teamId_fkey"
FOREIGN KEY ("teamId")
REFERENCES "Team"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Backfill existing single-team tactic assignments.
INSERT INTO "TacticTeam" ("tacticId", "teamId", "createdAt")
SELECT
    "id",
    "teamId",
    CURRENT_TIMESTAMP
FROM "Tactic"
WHERE "teamId" IS NOT NULL
ON CONFLICT ("tacticId", "teamId") DO NOTHING;