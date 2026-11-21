/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `apiKey` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apiKey" TEXT NOT NULL,
ADD COLUMN     "apiOneHourUsage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "apiUsage" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKey_key" ON "User"("apiKey");
