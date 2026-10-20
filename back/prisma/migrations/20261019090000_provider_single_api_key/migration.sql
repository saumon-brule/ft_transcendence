-- DropForeignKey
ALTER TABLE "ProviderApiKey" DROP CONSTRAINT "ProviderApiKey_providerId_fkey";

-- DropTable
DROP TABLE "ProviderApiKey";

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "hashedKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Provider_hashedKey_key" ON "Provider"("hashedKey");
