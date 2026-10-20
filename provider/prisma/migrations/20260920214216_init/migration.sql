/*
  Warnings:

  - You are about to drop the column `createdById` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Music` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Role` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `AccessRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userUuid` to the `AccessRequest` table without a default value. This is not possible if the table is not empty.
  - The required column `uuid` was added to the `Role` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Album" DROP CONSTRAINT "Album_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Artist" DROP CONSTRAINT "Artist_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Music" DROP CONSTRAINT "Music_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_createdById_fkey";

-- DropIndex
DROP INDEX "Album_createdById_idx";

-- DropIndex
DROP INDEX "Artist_createdById_idx";

-- DropIndex
DROP INDEX "Music_createdById_idx";

-- DropIndex
DROP INDEX "Role_createdById_idx";

-- AlterTable
ALTER TABLE "AccessRequest" ADD COLUMN     "userUuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Album" DROP COLUMN "createdById",
ADD COLUMN     "addedById" INTEGER;

-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "createdById",
ADD COLUMN     "addedById" INTEGER;

-- AlterTable
ALTER TABLE "Music" DROP COLUMN "createdById",
ADD COLUMN     "addedById" INTEGER;

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "createdById",
ADD COLUMN     "addedById" INTEGER,
ADD COLUMN     "uuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AccessRequest_uuid_key" ON "AccessRequest"("uuid");

-- CreateIndex
CREATE INDEX "AccessRequest_userUuid_idx" ON "AccessRequest"("userUuid");

-- CreateIndex
CREATE INDEX "Album_addedById_idx" ON "Album"("addedById");

-- CreateIndex
CREATE INDEX "Album_uuid_idx" ON "Album"("uuid");

-- CreateIndex
CREATE INDEX "Artist_addedById_idx" ON "Artist"("addedById");

-- CreateIndex
CREATE INDEX "Artist_uuid_idx" ON "Artist"("uuid");

-- CreateIndex
CREATE INDEX "Member_uuid_idx" ON "Member"("uuid");

-- CreateIndex
CREATE INDEX "Music_addedById_idx" ON "Music"("addedById");

-- CreateIndex
CREATE INDEX "Music_uuid_idx" ON "Music"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Role_uuid_key" ON "Role"("uuid");

-- CreateIndex
CREATE INDEX "Role_addedById_idx" ON "Role"("addedById");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music" ADD CONSTRAINT "Music_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
