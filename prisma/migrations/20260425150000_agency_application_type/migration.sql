-- AlterTable
ALTER TABLE "agency_applications" ADD COLUMN IF NOT EXISTS "applicationType" TEXT NOT NULL DEFAULT 'agent';
