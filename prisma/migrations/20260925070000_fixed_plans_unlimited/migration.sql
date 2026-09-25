-- Replace per-academy custom offers with four fixed commercial plans.
--
-- Fixed plans:
-- STARTER      10,000 ALL/month
-- PRO          15,000 ALL/month
-- PRO_PORTAL   20,000 ALL/month
-- UNLIMITED    30,000 ALL/month
--
-- NULL plan limits mean unlimited capacity.
--
-- Existing active custom offers that grant ATHLETE_PORTAL are migrated
-- to PRO_PORTAL before AcademyCustomOffer is removed.
-- Historical SubscriptionPayment rows are intentionally unchanged.

-- 1. Preserve Athlete Portal access for subscriptions currently receiving
--    ATHLETE_PORTAL through an active custom offer.
UPDATE "AcademySubscription" AS s
SET
    "planId" = 'plan_pro_portal',
    "updatedAt" = CURRENT_TIMESTAMP
FROM "AcademyCustomOffer" AS o
WHERE
    o."subscriptionId" = s."id"
    AND o."isActive" = true
    AND o."validFrom" <= CURRENT_TIMESTAMP
    AND (
        o."validUntil" IS NULL
        OR o."validUntil" > CURRENT_TIMESTAMP
    )
    AND o."overrideFeatures" = true
    AND 'ATHLETE_PORTAL'::"PlanFeature" = ANY(o."features");

-- 2. Plan limits become nullable.
--    NULL is the explicit representation of unlimited capacity.
ALTER TABLE "Plan"
    ALTER COLUMN "maxPlayers" DROP NOT NULL,
    ALTER COLUMN "maxTeams" DROP NOT NULL,
    ALTER COLUMN "maxStaff" DROP NOT NULL,
    ALTER COLUMN "maxFacilities" DROP NOT NULL,
    ALTER COLUMN "maxAthleteAccounts" DROP NOT NULL;

-- 3. Update the three existing fixed plans.
UPDATE "Plan"
SET
    "monthlyPrice" = 10000.00,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'STARTER';

UPDATE "Plan"
SET
    "monthlyPrice" = 15000.00,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'PRO';

UPDATE "Plan"
SET
    "monthlyPrice" = 20000.00,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'PRO_PORTAL';

-- 4. Add the fixed UNLIMITED plan.
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
    "maxAthleteAccounts",
    "features",
    "isActive",
    "sortOrder",
    "createdAt",
    "updatedAt"
)
VALUES (
    'plan_unlimited',
    'UNLIMITED',
    'Unlimited',
    'Plani i plote pa limite per akademite qe kerkojne kapacitet maksimal.',
    30000.00,
    'ALL',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    ARRAY[
        'MEDICAL',
        'PHYSICAL_PROFILE',
        'PERFORMANCE',
        'SCOUTING',
        'TACTICS',
        'KNOWLEDGE_BASE',
        'FACILITY_SCHEDULING',
        'ADVANCED_REPORTS',
        'ATHLETE_PORTAL'
    ]::"PlanFeature"[],
    true,
    4,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 5. AcademyCustomOffer is intentionally retained in the database for now.
--    Runtime code no longer depends on custom offers, but the legacy table is
--    preserved during this deployment as an expand/contract safety measure.
--    It can be removed in a later cleanup migration after the new application
--    version has been deployed and verified in production.