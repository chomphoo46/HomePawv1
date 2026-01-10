-- CreateEnum
CREATE TYPE "AdoptionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AdoptionRequest" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" INTEGER NOT NULL,
    "status" "AdoptionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "contact_info" VARCHAR(100),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdoptionRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "PetRehomePost"("post_id") ON DELETE RESTRICT ON UPDATE CASCADE;
