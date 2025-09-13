/*
  Warnings:

  - You are about to drop the column `user_id` on the `AnimalReports` table. All the data in the column will be lost.
  - You are about to drop the column `sex` on the `PetRehomePost` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AnimalReports" DROP CONSTRAINT "AnimalReports_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."AnimalReports" DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "public"."PetRehomePost" DROP COLUMN "sex";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role";

-- DropEnum
DROP TYPE "public"."PetSex";

-- DropEnum
DROP TYPE "public"."Role";
