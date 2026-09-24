ALTER TABLE "AcademyApplication"
ADD COLUMN "requestedPlanCode" TEXT;

ALTER TABLE "AcademyApplication"
ADD CONSTRAINT "AcademyApplication_requestedPlanCode_check"
CHECK (
  "requestedPlanCode" IS NULL
  OR "requestedPlanCode" IN ('STARTER', 'PRO', 'PRO_PORTAL')
);