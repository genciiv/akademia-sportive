/*
  Warnings:

  - You are about to drop the `AcademyDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AcademyDocument" DROP CONSTRAINT "AcademyDocument_academyId_fkey";

-- DropForeignKey
ALTER TABLE "AcademyDocument" DROP CONSTRAINT "AcademyDocument_playerId_fkey";

-- DropForeignKey
ALTER TABLE "AcademyDocument" DROP CONSTRAINT "AcademyDocument_uploadedByUserId_fkey";

-- DropTable
DROP TABLE "AcademyDocument";

-- DropEnum
DROP TYPE "AcademyDocumentCategory";
