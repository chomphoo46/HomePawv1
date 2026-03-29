import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// ดึงข้อมูลโพสต์ทั้งหมดจากฐานข้อมูล
export async function GET() {
  try {
    const posts = await prisma.petRehomePost.findMany();
    return Response.json(posts, { status: 200 });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const {
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
    
    if (!pet_name || !type || !phone) {
      return new Response("Missing required fields", { status: 400 });
    }

    const newPost = await prisma.petRehomePost.create({
      data: {
        user_id: session.user.id,
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
    return Response.json(newPost, { status: 201 });
  } catch (error) {
    return new Response(error as BodyInit, {
      status: 500,
    });
  }
}
