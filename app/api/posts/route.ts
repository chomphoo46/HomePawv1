import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  return Response.json(await prisma.petRehomePost.findMany());
}

export async function POST(req: Request) {
  try {
    const {
      user_id,
      phone,
      pet_name,
      type,
      age,
      vaccination_status,
      reason,
      status,
      sex,
      address,
      contact,
      neutered_status,
    } = await req.json();

    const newPost = await prisma.petRehomePost.create({
      data: {
        user_id,
        phone,
        pet_name,
        type,
        age,
        vaccination_status,
        reason,
        status,
        sex,
        address,
        contact,
        neutered_status,
      },
    });
    return Response.json(newPost);
  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    });
  }
}
