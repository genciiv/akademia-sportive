CREATE TABLE "PlatformAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformAuditLog_createdAt_idx"
ON "PlatformAuditLog"("createdAt");

CREATE INDEX "PlatformAuditLog_actorUserId_idx"
ON "PlatformAuditLog"("actorUserId");

CREATE INDEX "PlatformAuditLog_action_idx"
ON "PlatformAuditLog"("action");

CREATE INDEX "PlatformAuditLog_entityType_entityId_idx"
ON "PlatformAuditLog"("entityType", "entityId");

ALTER TABLE "PlatformAuditLog"
ADD CONSTRAINT "PlatformAuditLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;