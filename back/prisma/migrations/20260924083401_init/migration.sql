/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Music` will be added. If there are existing duplicate values, this will fail.
  - The required column `uuid` was added to the `Music` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Music" ADD COLUMN     "uuid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "private" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "publicDisplay" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProviderUser" ADD COLUMN     "publicDisplay" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentlyListeningId" INTEGER,
ADD COLUMN     "listeningPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listeningUntil" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Music_uuid_key" ON "Music"("uuid");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentlyListeningId_fkey" FOREIGN KEY ("currentlyListeningId") REFERENCES "Music"("id") ON DELETE SET NULL ON UPDATE CASCADE;
