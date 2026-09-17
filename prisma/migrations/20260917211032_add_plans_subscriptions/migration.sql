-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentMethod" AS ENUM ('CASH');

-- CreateEnum
CREATE TYPE "PlanFeature" AS ENUM ('MEDICAL', 'PHYSICAL_PROFILE', 'PERFORMANCE', 'SCOUTING', 'TACTICS', 'KNOWLEDGE_BASE', 'FACILITY_SCHEDULING', 'ADVANCED_REPORTS');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ALL',
    "maxPlayers" INTEGER NOT NULL,
    "maxTeams" INTEGER NOT NULL,
    "maxStaff" INTEGER NOT NULL,
    "maxFacilities" INTEGER NOT NULL,
    "features" "PlanFeature"[] DEFAULT ARRAY[]::"PlanFeature"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademySubscription" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialStartsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "graceEndsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ALL',
    "method" "SubscriptionPaymentMethod" NOT NULL DEFAULT 'CASH',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "Plan_isActive_sortOrder_idx" ON "Plan"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AcademySubscription_academyId_key" ON "AcademySubscription"("academyId");

-- CreateIndex
CREATE INDEX "AcademySubscription_planId_idx" ON "AcademySubscription"("planId");

-- CreateIndex
CREATE INDEX "AcademySubscription_status_idx" ON "AcademySubscription"("status");

-- CreateIndex
CREATE INDEX "AcademySubscription_status_currentPeriodEnd_idx" ON "AcademySubscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_academyId_idx" ON "SubscriptionPayment"("academyId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_planId_idx" ON "SubscriptionPayment"("planId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_paidAt_idx" ON "SubscriptionPayment"("paidAt");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_recordedById_idx" ON "SubscriptionPayment"("recordedById");

-- AddForeignKey
ALTER TABLE "AcademySubscription" ADD CONSTRAINT "AcademySubscription_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademySubscription" ADD CONSTRAINT "AcademySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AcademySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforce supported subscription payment periods
ALTER TABLE "SubscriptionPayment"
ADD CONSTRAINT "SubscriptionPayment_months_check"
CHECK ("months" IN (1, 3, 6, 12));

-- Seed default SaaS plans
INSERT INTO "Plan" (
    "id",
    "code",
    "name",
    "description",
    "monthlyPrice",
    "currency",
    "maxPlayers",
    "maxTeams",
    "maxStaff",
    "maxFacilities",
    "features",
    "isActive",
    "sortOrder",
    "createdAt",
    "updatedAt"
)
VALUES
(
    'plan_starter',
    'STARTER',
    'Starter',
    NULL,
    12000.00,
    'ALL',
    35,
    5,
    5,
    5,
    ARRAY[]::"PlanFeature"[],
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'plan_pro',
    'PRO',
    'Pro',
    NULL,
    20000.00,
    'ALL',
    300,
    25,
    50,
    15,
    ARRAY[
        'MEDICAL',
        'PHYSICAL_PROFILE',
        'PERFORMANCE',
        'SCOUTING',
        'TACTICS',
        'KNOWLEDGE_BASE',
        'FACILITY_SCHEDULING',
        'ADVANCED_REPORTS'
    ]::"PlanFeature"[],
    true,
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Give existing academies a fresh 7-day PRO trial.
-- Cancelled academies receive a cancelled subscription without trial dates.
INSERT INTO "AcademySubscription" (
    "id",
    "academyId",
    "planId",
    "status",
    "trialStartsAt",
    "trialEndsAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'sub_' || academy."id",
    academy."id",
    plan."id",
    CASE
        WHEN academy."status" = 'CANCELLED'::"AcademyStatus"
            THEN 'CANCELLED'::"SubscriptionStatus"
        ELSE 'TRIALING'::"SubscriptionStatus"
    END,
    CASE
        WHEN academy."status" = 'CANCELLED'::"AcademyStatus"
            THEN NULL
        ELSE CURRENT_TIMESTAMP
    END,
    CASE
        WHEN academy."status" = 'CANCELLED'::"AcademyStatus"
            THEN NULL
        ELSE CURRENT_TIMESTAMP + INTERVAL '7 days'
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Academy" AS academy
JOIN "Plan" AS plan
    ON plan."code" = 'PRO'
ON CONFLICT ("academyId") DO NOTHING;
