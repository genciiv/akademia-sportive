-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('MEETING', 'MEDICAL', 'TRIAL', 'TOURNAMENT', 'ADMINISTRATIVE', 'OTHER');

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CalendarEventType" NOT NULL DEFAULT 'OTHER',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_academyId_idx" ON "CalendarEvent"("academyId");

-- CreateIndex
CREATE INDEX "CalendarEvent_academyId_startsAt_idx" ON "CalendarEvent"("academyId", "startsAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_academyId_type_idx" ON "CalendarEvent"("academyId", "type");

-- CreateIndex
CREATE INDEX "CalendarEvent_teamId_idx" ON "CalendarEvent"("teamId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
