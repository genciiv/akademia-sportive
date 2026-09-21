-- AlterTable
ALTER TABLE "AcademyApplication" ADD COLUMN     "onboardingExpiresAt" TIMESTAMP(3),
ADD COLUMN     "onboardingToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AcademyApplication_onboardingToken_key" ON "AcademyApplication"("onboardingToken");
