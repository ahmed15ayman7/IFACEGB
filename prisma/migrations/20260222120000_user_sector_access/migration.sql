-- CreateEnum
CREATE TYPE "SectorAccessLevel" AS ENUM ('manager', 'read_only');

-- CreateTable
CREATE TABLE "user_sector_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "accessLevel" "SectorAccessLevel" NOT NULL DEFAULT 'manager',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "user_sector_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sector_access_userId_sectorId_key" ON "user_sector_access"("userId", "sectorId");

-- CreateIndex
CREATE INDEX "user_sector_access_userId_idx" ON "user_sector_access"("userId");

-- CreateIndex
CREATE INDEX "user_sector_access_sectorId_idx" ON "user_sector_access"("sectorId");

-- AddForeignKey
ALTER TABLE "user_sector_access" ADD CONSTRAINT "user_sector_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sector_access" ADD CONSTRAINT "user_sector_access_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
