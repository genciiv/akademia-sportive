ALTER TABLE "Facility"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "Facility"
ADD CONSTRAINT "Facility_latitude_range_check"
CHECK (
  "latitude" IS NULL
  OR ("latitude" >= -90 AND "latitude" <= 90)
);

ALTER TABLE "Facility"
ADD CONSTRAINT "Facility_longitude_range_check"
CHECK (
  "longitude" IS NULL
  OR ("longitude" >= -180 AND "longitude" <= 180)
);

ALTER TABLE "Facility"
ADD CONSTRAINT "Facility_coordinates_pair_check"
CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL)
  OR
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)
);