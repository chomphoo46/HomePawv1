/*
  Warnings:

  - The values [ย้ายที่อยู่,ได้รับการช่วยเหลือ] on the enum `AnimalReportStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AnimalReportStatus_new" AS ENUM ('MOVED', 'RESCUED');
ALTER TABLE "public"."AnimalReports" ALTER COLUMN "status" TYPE "public"."AnimalReportStatus_new" USING ("status"::text::"public"."AnimalReportStatus_new");
ALTER TYPE "public"."AnimalReportStatus" RENAME TO "AnimalReportStatus_old";
ALTER TYPE "public"."AnimalReportStatus_new" RENAME TO "AnimalReportStatus";
DROP TYPE "public"."AnimalReportStatus_old";
COMMIT;

-- DropTable
DROP TABLE "public"."Post";
