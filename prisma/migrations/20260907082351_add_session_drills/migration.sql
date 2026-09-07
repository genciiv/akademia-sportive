-- CreateTable
CREATE TABLE "TrainingSessionDrill" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "durationMin" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSessionDrill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingSessionDrill_trainingSessionId_idx" ON "TrainingSessionDrill"("trainingSessionId");

-- CreateIndex
CREATE INDEX "TrainingSessionDrill_trainingSessionId_order_idx" ON "TrainingSessionDrill"("trainingSessionId", "order");

-- CreateIndex
CREATE INDEX "TrainingSessionDrill_drillId_idx" ON "TrainingSessionDrill"("drillId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSessionDrill_trainingSessionId_drillId_key" ON "TrainingSessionDrill"("trainingSessionId", "drillId");

-- AddForeignKey
ALTER TABLE "TrainingSessionDrill" ADD CONSTRAINT "TrainingSessionDrill_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSessionDrill" ADD CONSTRAINT "TrainingSessionDrill_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
