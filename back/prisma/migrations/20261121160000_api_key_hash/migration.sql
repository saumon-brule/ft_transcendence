-- Plaintext keys are dropped: nobody could read them, users just regenerate one
-- DropIndex
DROP INDEX "User_apiKey_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "apiKey",
ADD COLUMN     "apiKeyHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKeyHash_key" ON "User"("apiKeyHash");
