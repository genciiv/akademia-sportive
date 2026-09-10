-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGuardian" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relationship" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainingSessionId" TEXT,

    CONSTRAINT "PlayerGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guardian_academyId_idx" ON "Guardian"("academyId");

-- CreateIndex
CREATE INDEX "Guardian_academyId_lastName_firstName_idx" ON "Guardian"("academyId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "Guardian_academyId_phone_idx" ON "Guardian"("academyId", "phone");

-- CreateIndex
CREATE INDEX "Guardian_academyId_email_idx" ON "Guardian"("academyId", "email");

-- CreateIndex
CREATE INDEX "PlayerGuardian_academyId_idx" ON "PlayerGuardian"("academyId");

-- CreateIndex
CREATE INDEX "PlayerGuardian_playerId_idx" ON "PlayerGuardian"("playerId");

-- CreateIndex
CREATE INDEX "PlayerGuardian_guardianId_idx" ON "PlayerGuardian"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGuardian_playerId_guardianId_key" ON "PlayerGuardian"("playerId", "guardianId");

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGuardian" ADD CONSTRAINT "PlayerGuardian_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
