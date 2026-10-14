/*
  Warnings:

  - A unique constraint covering the columns `[intraId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "intraId" INTEGER,
ADD COLUMN     "language" TEXT DEFAULT 'en';

-- CreateIndex
CREATE UNIQUE INDEX "User_intraId_key" ON "User"("intraId");
