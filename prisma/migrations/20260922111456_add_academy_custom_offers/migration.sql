-- CreateTable
CREATE TABLE "AcademyCustomOffer" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(12,2),
    "currency" TEXT,
    "maxPlayers" INTEGER,
    "maxTeams" INTEGER,
    "maxStaff" INTEGER,
    "maxFacilities" INTEGER,
    "overrideFeatures" BOOLEAN NOT NULL DEFAULT false,
    "features" "PlanFeature"[] DEFAULT ARRAY[]::"PlanFeature"[],
    "note" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyCustomOffer_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "AcademyCustomOffer_monthlyPrice_check"
      CHECK ("monthlyPrice" IS NULL OR "monthlyPrice" >= 0),

    CONSTRAINT "AcademyCustomOffer_maxPlayers_check"
      CHECK ("maxPlayers" IS NULL OR "maxPlayers" >= 0),

    CONSTRAINT "AcademyCustomOffer_maxTeams_check"
      CHECK ("maxTeams" IS NULL OR "maxTeams" >= 0),

    CONSTRAINT "AcademyCustomOffer_maxStaff_check"
      CHECK ("maxStaff" IS NULL OR "maxStaff" >= 0),

    CONSTRAINT "AcademyCustomOffer_maxFacilities_check"
      CHECK ("maxFacilities" IS NULL OR "maxFacilities" >= 0),

    CONSTRAINT "AcademyCustomOffer_validity_check"
      CHECK ("validUntil" IS NULL OR "validUntil" > "validFrom")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademyCustomOffer_subscriptionId_key"
ON "AcademyCustomOffer"("subscriptionId");

-- CreateIndex
CREATE INDEX "AcademyCustomOffer_isActive_validUntil_idx"
ON "AcademyCustomOffer"("isActive", "validUntil");

-- CreateIndex
CREATE INDEX "AcademyCustomOffer_createdById_idx"
ON "AcademyCustomOffer"("createdById");

-- CreateIndex
CREATE INDEX "AcademyCustomOffer_updatedById_idx"
ON "AcademyCustomOffer"("updatedById");

-- AddForeignKey
ALTER TABLE "AcademyCustomOffer"
ADD CONSTRAINT "AcademyCustomOffer_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId")
REFERENCES "AcademySubscription"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCustomOffer"
ADD CONSTRAINT "AcademyCustomOffer_createdById_fkey"
FOREIGN KEY ("createdById")
REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyCustomOffer"
ADD CONSTRAINT "AcademyCustomOffer_updatedById_fkey"
FOREIGN KEY ("updatedById")
REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
