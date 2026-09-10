-- CreateTable
CREATE TABLE "AcademySeason" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademySeason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademySeason_academyId_idx" ON "AcademySeason"("academyId");

-- CreateIndex
CREATE INDEX "AcademySeason_academyId_isActive_idx" ON "AcademySeason"("academyId", "isActive");

-- CreateIndex
CREATE INDEX "AcademySeason_academyId_startsAt_endsAt_idx" ON "AcademySeason"("academyId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcademySeason_academyId_name_key" ON "AcademySeason"("academyId", "name");

-- AddForeignKey
ALTER TABLE "AcademySeason" ADD CONSTRAINT "AcademySeason_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
