/*
  Warnings:

  - You are about to drop the column `avatarUpdatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `intraId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_intraId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUpdatedAt",
DROP COLUMN "intraId",
DROP COLUMN "language";
