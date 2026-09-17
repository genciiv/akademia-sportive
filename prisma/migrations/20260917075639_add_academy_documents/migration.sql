-- CreateEnum
CREATE TYPE "AcademyDocumentCategory" AS ENUM ('GENERAL', 'REGISTRATION', 'IDENTITY', 'CONSENT', 'CONTRACT', 'CERTIFICATE', 'INSURANCE', 'OTHER');

-- CreateTable
CREATE TABLE "AcademyDocument" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "playerId" TEXT,
    "uploadedByUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "AcademyDocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "originalFileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademyDocument_storagePath_key" ON "AcademyDocument"("storagePath");

-- CreateIndex
CREATE INDEX "AcademyDocument_academyId_createdAt_idx" ON "AcademyDocument"("academyId", "createdAt");

-- CreateIndex
CREATE INDEX "AcademyDocument_academyId_category_idx" ON "AcademyDocument"("academyId", "category");

-- CreateIndex
CREATE INDEX "AcademyDocument_academyId_playerId_idx" ON "AcademyDocument"("academyId", "playerId");

-- CreateIndex
CREATE INDEX "AcademyDocument_playerId_idx" ON "AcademyDocument"("playerId");

-- CreateIndex
CREATE INDEX "AcademyDocument_uploadedByUserId_idx" ON "AcademyDocument"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "AcademyDocument" ADD CONSTRAINT "AcademyDocument_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyDocument" ADD CONSTRAINT "AcademyDocument_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyDocument" ADD CONSTRAINT "AcademyDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
