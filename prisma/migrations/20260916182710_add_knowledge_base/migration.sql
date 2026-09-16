-- CreateEnum
CREATE TYPE "KnowledgeArticleCategory" AS ENUM ('METHODOLOGY', 'POLICY', 'PROCEDURE', 'COMMUNICATION', 'DEVELOPMENT', 'SAFEGUARDING', 'RESOURCE', 'OTHER');

-- CreateEnum
CREATE TYPE "KnowledgeArticleAudience" AS ENUM ('ALL', 'COACHES', 'STAFF', 'PLAYERS', 'PARENTS');

-- CreateEnum
CREATE TYPE "KnowledgeArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "category" "KnowledgeArticleCategory" NOT NULL DEFAULT 'OTHER',
    "audience" "KnowledgeArticleAudience" NOT NULL DEFAULT 'ALL',
    "status" "KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "sourceUrl" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeArticle_academyId_idx" ON "KnowledgeArticle"("academyId");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_academyId_status_idx" ON "KnowledgeArticle"("academyId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_academyId_category_idx" ON "KnowledgeArticle"("academyId", "category");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_academyId_audience_idx" ON "KnowledgeArticle"("academyId", "audience");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_academyId_isPinned_idx" ON "KnowledgeArticle"("academyId", "isPinned");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_authorId_idx" ON "KnowledgeArticle"("authorId");

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
