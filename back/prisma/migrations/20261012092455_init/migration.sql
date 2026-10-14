/*
  Warnings:

  - Made the column `avatarUpdatedAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatarUpdatedAt" SET NOT NULL,
ALTER COLUMN "avatarUpdatedAt" SET DEFAULT CURRENT_TIMESTAMP;
