/*
  Warnings:

  - Added the required column `providerId` to the `Music` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Music" ADD COLUMN     "providerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Music" ADD CONSTRAINT "Music_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
