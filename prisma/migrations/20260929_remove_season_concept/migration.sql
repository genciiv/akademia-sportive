-- Remove obsolete season concept

DROP TABLE IF EXISTS "AcademySeason";

ALTER TABLE "Team" DROP COLUMN IF EXISTS "season";
