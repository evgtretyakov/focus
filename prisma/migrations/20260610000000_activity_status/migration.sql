-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "status" "ActivityStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- Migrate existing completed activities
UPDATE "Activity" SET "status" = 'COMPLETED' WHERE "completedAt" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");
