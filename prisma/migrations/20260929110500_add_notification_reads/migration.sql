CREATE TABLE "NotificationRead" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationRead_notificationId_userId_key"
ON "NotificationRead"("notificationId", "userId");

CREATE INDEX "NotificationRead_userId_idx"
ON "NotificationRead"("userId");

CREATE INDEX "NotificationRead_notificationId_idx"
ON "NotificationRead"("notificationId");

ALTER TABLE "NotificationRead"
ADD CONSTRAINT "NotificationRead_notificationId_fkey"
FOREIGN KEY ("notificationId")
REFERENCES "Notification"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "NotificationRead"
ADD CONSTRAINT "NotificationRead_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;