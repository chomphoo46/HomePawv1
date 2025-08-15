-- AlterTable
ALTER TABLE "public"."AnimalReports" ADD COLUMN     "user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."AnimalReports" ADD CONSTRAINT "AnimalReports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
