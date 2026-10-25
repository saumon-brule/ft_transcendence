-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ProviderAccessRequest" (
    "id" SERIAL NOT NULL,
    "providerUUID" TEXT NOT NULL,
    "userUUID" TEXT NOT NULL,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderAccessRequest_userUUID_idx" ON "ProviderAccessRequest"("userUUID");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAccessRequest_providerUUID_userUUID_key" ON "ProviderAccessRequest"("providerUUID", "userUUID");

-- AddForeignKey
ALTER TABLE "ProviderAccessRequest" ADD CONSTRAINT "ProviderAccessRequest_providerUUID_fkey" FOREIGN KEY ("providerUUID") REFERENCES "Provider"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccessRequest" ADD CONSTRAINT "ProviderAccessRequest_userUUID_fkey" FOREIGN KEY ("userUUID") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
