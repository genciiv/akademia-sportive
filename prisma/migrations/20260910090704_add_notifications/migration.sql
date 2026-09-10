-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('ALL', 'TEAM');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" "NotificationAudience" NOT NULL DEFAULT 'ALL',
    "teamId" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "NotificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_academyId_idx" ON "Notification"("academyId");

-- CreateIndex
CREATE INDEX "Notification_academyId_status_idx" ON "Notification"("academyId", "status");

-- CreateIndex
CREATE INDEX "Notification_academyId_publishedAt_idx" ON "Notification"("academyId", "publishedAt");

-- CreateIndex
CREATE INDEX "Notification_teamId_idx" ON "Notification"("teamId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
