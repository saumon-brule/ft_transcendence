/*
  Warnings:

  - You are about to drop the column `currentlyListeningUUID` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `listeningPrivate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `listeningUntil` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Music` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_currentlyListeningUUID_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentlyListeningUUID",
DROP COLUMN "listeningPrivate",
DROP COLUMN "listeningUntil";

-- DropTable
DROP TABLE "Music";
