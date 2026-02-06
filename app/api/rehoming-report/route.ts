import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  PrismaClient,
  PetRehomeStatus,
  VaccinationStatus,
  NeuteredStatus,
  PetSex,
} from "@prisma/client";

const prisma = new PrismaClient();

// POST - เพิ่มประกาศ (รองรับ JSON และ Vercel Blob URL)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. เปลี่ยนจาก formData เป็น json
    const body = await req.json();

    const {
      phone,
      pet_name,
      type,
      age,
      sex,
      vaccination_status: vaccStr,
      neutered_status: neuterStr,
      reason,
      address,
      contact,
      images, // อาร์เรย์ของ URL (https://...) ที่ได้จาก Vercel Blob
    } = body;

    // 2. ตรวจสอบข้อมูลบังคับ
    if (
      !phone || !pet_name || !type || !sex || !age || 
      !vaccStr || !neuterStr || !reason || !address || 
      !images || images.length === 0
    ) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }

    // 3. แปลงค่า Enum ให้ตรงกับ Prisma
    const vaccination_status = vaccStr as VaccinationStatus;
    const neutered_status = neuterStr as NeuteredStatus;
    const sexEnum = sex as PetSex;

    // 4. บันทึกลงฐานข้อมูล Neon
    const createdPost = await prisma.petRehomePost.create({
      data: {
        user_id: session.user.id,
        phone,
        pet_name,
        type,
        sex: sexEnum,
        age,
        vaccination_status,
        neutered_status,
        address,
        contact,
        reason,
        status: PetRehomeStatus.AVAILABLE,
        images: {
          create: images.map((url: string) => ({
            image_url: url,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET - ดึงประกาศทั้งหมด
export async function GET() {
  try {
    const posts = await prisma.petRehomePost.findMany({
      orderBy: { created_at: "desc" },
      include: {
        images: true,
        user: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}