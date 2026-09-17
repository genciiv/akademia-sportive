-- CreateTable
CREATE TABLE "PlayerPhysicalMeasurement" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bodyFatPercent" DOUBLE PRECISION,
    "muscleMassKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerPhysicalMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerPhysicalMeasurement_playerId_measuredAt_idx" ON "PlayerPhysicalMeasurement"("playerId", "measuredAt");

-- AddForeignKey
ALTER TABLE "PlayerPhysicalMeasurement" ADD CONSTRAINT "PlayerPhysicalMeasurement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
