-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('FOOTBALL_FIELD', 'BASKETBALL_COURT', 'VOLLEYBALL_COURT', 'TENNIS_COURT', 'SWIMMING_POOL', 'GYM', 'FITNESS_ROOM', 'MULTIPURPOSE_HALL', 'CLASSROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FacilityType" NOT NULL DEFAULT 'OTHER',
    "status" "FacilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "isIndoor" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "surface" TEXT,
    "dimensions" TEXT,
    "address" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Facility_academyId_idx" ON "Facility"("academyId");

-- CreateIndex
CREATE INDEX "Facility_academyId_status_idx" ON "Facility"("academyId", "status");

-- CreateIndex
CREATE INDEX "Facility_academyId_type_idx" ON "Facility"("academyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_academyId_name_key" ON "Facility"("academyId", "name");

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
