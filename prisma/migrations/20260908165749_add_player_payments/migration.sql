-- CreateEnum
CREATE TYPE "PlayerChargeStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "PlayerFee" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "amountLek" INTEGER NOT NULL,
    "description" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainingSessionId" TEXT,

    CONSTRAINT "PlayerFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCharge" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amountLek" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "periodMonth" INTEGER,
    "periodYear" INTEGER,
    "status" "PlayerChargeStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainingSessionId" TEXT,

    CONSTRAINT "PlayerCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashPayment" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amountLek" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainingSessionId" TEXT,

    CONSTRAINT "CashPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerFee_academyId_idx" ON "PlayerFee"("academyId");

-- CreateIndex
CREATE INDEX "PlayerFee_playerId_idx" ON "PlayerFee"("playerId");

-- CreateIndex
CREATE INDEX "PlayerFee_academyId_isActive_idx" ON "PlayerFee"("academyId", "isActive");

-- CreateIndex
CREATE INDEX "PlayerCharge_academyId_idx" ON "PlayerCharge"("academyId");

-- CreateIndex
CREATE INDEX "PlayerCharge_playerId_idx" ON "PlayerCharge"("playerId");

-- CreateIndex
CREATE INDEX "PlayerCharge_academyId_status_idx" ON "PlayerCharge"("academyId", "status");

-- CreateIndex
CREATE INDEX "PlayerCharge_academyId_dueDate_idx" ON "PlayerCharge"("academyId", "dueDate");

-- CreateIndex
CREATE INDEX "PlayerCharge_playerId_periodYear_periodMonth_idx" ON "PlayerCharge"("playerId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "CashPayment_academyId_idx" ON "CashPayment"("academyId");

-- CreateIndex
CREATE INDEX "CashPayment_playerId_idx" ON "CashPayment"("playerId");

-- CreateIndex
CREATE INDEX "CashPayment_chargeId_idx" ON "CashPayment"("chargeId");

-- CreateIndex
CREATE INDEX "CashPayment_academyId_paidAt_idx" ON "CashPayment"("academyId", "paidAt");

-- AddForeignKey
ALTER TABLE "PlayerFee" ADD CONSTRAINT "PlayerFee_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerFee" ADD CONSTRAINT "PlayerFee_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerFee" ADD CONSTRAINT "PlayerFee_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharge" ADD CONSTRAINT "PlayerCharge_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharge" ADD CONSTRAINT "PlayerCharge_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharge" ADD CONSTRAINT "PlayerCharge_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPayment" ADD CONSTRAINT "CashPayment_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPayment" ADD CONSTRAINT "CashPayment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPayment" ADD CONSTRAINT "CashPayment_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "PlayerCharge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPayment" ADD CONSTRAINT "CashPayment_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
