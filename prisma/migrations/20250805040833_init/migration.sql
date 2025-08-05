-- CreateEnum
CREATE TYPE "public"."AnimalReportStatus" AS ENUM ('ย้ายที่อยู่', 'ได้รับการช่วยเหลือ');

-- CreateEnum
CREATE TYPE "public"."HelpActionType" AS ENUM ('feed', 'adopt');

-- CreateEnum
CREATE TYPE "public"."HealthStatus" AS ENUM ('ฉีดวัดซีนแล้ว', 'ยังไม่ได้ฉีดวัคซีน');

-- CreateEnum
CREATE TYPE "public"."PetRehomeStatus" AS ENUM ('available', 'adopted');

-- CreateTable
CREATE TABLE "public"."User" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."AnimalReports" (
    "report_id" SERIAL NOT NULL,
    "animal_type" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "behavior" VARCHAR(100) NOT NULL,
    "latitude" DECIMAL(10,6) NOT NULL,
    "longitude" DECIMAL(10,6) NOT NULL,
    "status" "public"."AnimalReportStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimalReports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "public"."AnimalImage" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "AnimalImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HelpAction" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_id" INTEGER NOT NULL,
    "action_type" "public"."HelpActionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PetRehomePost" (
    "post_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "pet_name" VARCHAR(50) NOT NULL,
    "type" TEXT NOT NULL,
    "age" VARCHAR(100) NOT NULL,
    "health_status" "public"."HealthStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."PetRehomeStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetRehomePost_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "public"."PetRehomeImages" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "PetRehomeImages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."AnimalImage" ADD CONSTRAINT "AnimalImage_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."AnimalReports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HelpAction" ADD CONSTRAINT "HelpAction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HelpAction" ADD CONSTRAINT "HelpAction_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."AnimalReports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PetRehomePost" ADD CONSTRAINT "PetRehomePost_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PetRehomeImages" ADD CONSTRAINT "PetRehomeImages_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."PetRehomePost"("post_id") ON DELETE RESTRICT ON UPDATE CASCADE;
