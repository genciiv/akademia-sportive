-- CreateTable
CREATE TABLE "AcademyInvitation" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AcademyRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "invitedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademyInvitation_token_key" ON "AcademyInvitation"("token");

-- CreateIndex
CREATE INDEX "AcademyInvitation_academyId_email_idx" ON "AcademyInvitation"("academyId", "email");

-- CreateIndex
CREATE INDEX "AcademyInvitation_academyId_createdAt_idx" ON "AcademyInvitation"("academyId", "createdAt");

-- CreateIndex
CREATE INDEX "AcademyInvitation_invitedByUserId_idx" ON "AcademyInvitation"("invitedByUserId");

-- CreateIndex
CREATE INDEX "AcademyInvitation_expiresAt_idx" ON "AcademyInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "AcademyInvitation" ADD CONSTRAINT "AcademyInvitation_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyInvitation" ADD CONSTRAINT "AcademyInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
