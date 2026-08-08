-- CreateEnum
CREATE TYPE "Status" AS ENUM ('QUEUED', 'DONE');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'QUEUED';
