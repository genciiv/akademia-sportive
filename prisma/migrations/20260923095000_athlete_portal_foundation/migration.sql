-- AlterEnum
ALTER TYPE "PlanFeature" ADD VALUE 'ATHLETE_PORTAL';

-- AlterTable
ALTER TABLE "AcademyCustomOffer"
ADD COLUMN "maxAthleteAccounts" INTEGER;

-- AlterTable
ALTER TABLE "Plan"
ADD COLUMN "maxAthleteAccounts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AthleteAccount" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteInvitation" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "invitedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AthleteAccount_academyId_idx"
ON "AthleteAccount"("academyId");

-- CreateIndex
CREATE INDEX "AthleteAccount_userId_idx"
ON "AthleteAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteAccount_playerId_academyId_key"
ON "AthleteAccount"("playerId", "academyId");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteAccount_academyId_userId_key"
ON "AthleteAccount"("academyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteInvitation_token_key"
ON "AthleteInvitation"("token");

-- CreateIndex
CREATE INDEX "AthleteInvitation_academyId_email_idx"
ON "AthleteInvitation"("academyId", "email");

-- CreateIndex
CREATE INDEX "AthleteInvitation_academyId_playerId_idx"
ON "AthleteInvitation"("academyId", "playerId");

-- CreateIndex
CREATE INDEX "AthleteInvitation_playerId_idx"
ON "AthleteInvitation"("playerId");

-- CreateIndex
CREATE INDEX "AthleteInvitation_invitedByUserId_idx"
ON "AthleteInvitation"("invitedByUserId");

-- CreateIndex
CREATE INDEX "AthleteInvitation_expiresAt_idx"
ON "AthleteInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Player_id_academyId_key"
ON "Player"("id", "academyId");

-- AddForeignKey
ALTER TABLE "AthleteAccount"
ADD CONSTRAINT "AthleteAccount_academyId_fkey"
FOREIGN KEY ("academyId")
REFERENCES "Academy"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAccount"
ADD CONSTRAINT "AthleteAccount_playerId_academyId_fkey"
FOREIGN KEY ("playerId", "academyId")
REFERENCES "Player"("id", "academyId")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAccount"
ADD CONSTRAINT "AthleteAccount_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteInvitation"
ADD CONSTRAINT "AthleteInvitation_academyId_fkey"
FOREIGN KEY ("academyId")
REFERENCES "Academy"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteInvitation"
ADD CONSTRAINT "AthleteInvitation_playerId_academyId_fkey"
FOREIGN KEY ("playerId", "academyId")
REFERENCES "Player"("id", "academyId")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteInvitation"
ADD CONSTRAINT "AthleteInvitation_invitedByUserId_fkey"
FOREIGN KEY ("invitedByUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;