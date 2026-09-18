CREATE TYPE "AcademyApplicationStatus" AS ENUM (
  'PENDING',
  'CONTACTED',
  'APPROVED',
  'REJECTED'
);

CREATE TABLE "AcademyApplication" (
  "id" TEXT NOT NULL,
  "academyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "city" TEXT,
  "address" TEXT,
  "sport" TEXT,
  "message" TEXT,
  "status" "AcademyApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "reviewedByUserId" TEXT,
  "contactedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "createdAcademyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AcademyApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcademyApplication_status_createdAt_idx"
ON "AcademyApplication"("status", "createdAt");

CREATE INDEX "AcademyApplication_email_status_idx"
ON "AcademyApplication"("email", "status");

CREATE INDEX "AcademyApplication_reviewedByUserId_idx"
ON "AcademyApplication"("reviewedByUserId");

CREATE INDEX "AcademyApplication_createdAcademyId_idx"
ON "AcademyApplication"("createdAcademyId");