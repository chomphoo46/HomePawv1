/*
  Warnings:

  - Added the required column `sex` to the `PetRehomePost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PetSex" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "public"."PetRehomePost" ADD COLUMN     "sex" "public"."PetSex" NOT NULL;
