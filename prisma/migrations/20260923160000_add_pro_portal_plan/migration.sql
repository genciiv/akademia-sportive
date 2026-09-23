-- Add the standard PRO + Athlete Portal SaaS package.
--
-- CUSTOM is intentionally not a Plan row.
-- Per-academy negotiated pricing, limits and features continue to use
-- AcademyCustomOffer.

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
    'plan_pro_portal',
    'PRO_PORTAL',
    'Pro + Athlete Portal',
    'Plani Pro me portal të dedikuar për sportistët.',
    25000.00,
    'ALL',
    300,
    25,
    50,
    15,
    50,
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
    3,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);