/*
  Warnings:

  - You are about to drop the column `adress` on the `Provider` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Provider_adress_key";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "adress",
ADD COLUMN     "address" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Provider_address_key" ON "Provider"("address");
