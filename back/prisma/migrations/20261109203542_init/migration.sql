/*
  Warnings:

  - You are about to drop the column `providerId` on the `Music` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Music" DROP CONSTRAINT "Music_providerId_fkey";

-- AlterTable
ALTER TABLE "Music" DROP COLUMN "providerId";
