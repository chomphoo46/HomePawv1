/*
  Warnings:

  - Added the required column `sex` to the `PetRehomePost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PetSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "public"."AnimalReports" ADD COLUMN     "user_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."PetRehomePost" ADD COLUMN     "sex" "public"."PetSex" NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'user';

-- AddForeignKey
ALTER TABLE "public"."AnimalReports" ADD CONSTRAINT "AnimalReports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
