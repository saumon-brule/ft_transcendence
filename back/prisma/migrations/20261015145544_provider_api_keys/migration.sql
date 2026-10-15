-- CreateTable
CREATE TABLE "ProviderApiKey" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "providerId" INTEGER NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderApiKey_uuid_key" ON "ProviderApiKey"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderApiKey_keyHash_key" ON "ProviderApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ProviderApiKey_providerId_idx" ON "ProviderApiKey"("providerId");

-- AddForeignKey
ALTER TABLE "ProviderApiKey" ADD CONSTRAINT "ProviderApiKey_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
