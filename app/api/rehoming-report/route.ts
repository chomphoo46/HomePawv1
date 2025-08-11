import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, PetRehomeStatus, HealthStatus } from "@prisma/client";

const prisma = new PrismaClient();

// POST - เพิ่มประกาศ
export async function POST(req: Request) {
  // ✅ ดึง session จาก NextAuth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user_id = Number(session.user.id);

  try {
    const formData = await req.formData();

    const phone = formData.get("phone") as string;
    const pet_name = formData.get("pet_name") as string;
    const type = formData.get("type") as string;
    const age = formData.get("age") as string;
    const health_status_str = formData.get("health_status")?.toString() || "";
    const reason = formData.get("reason") as string;
    const images = formData.getAll("images") as File[];

    // ตรวจสอบข้อมูลบังคับ
    if (
      !phone ||
      !pet_name ||
      !type ||
      !age ||
      !health_status_str ||
      !reason ||
      images.length === 0
    ) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }

    // เก็บ path ของรูปที่จะใช้บันทึก
    const imageUrls: string[] = [];

    for (const file of images) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // สร้างชื่อไฟล์ใหม่
      const filename = `${Date.now()}-${file.name}`;
      const filePath = path.join(process.cwd(), "public/uploads", filename);

      await fs.writeFile(filePath, buffer);

      // เก็บ URL ไว้ใน array
      imageUrls.push(`/uploads/${filename}`);
    }

    // แปลง health_status เป็น enum
    const health_status =
      HealthStatus[health_status_str as keyof typeof HealthStatus];
    if (!health_status) {
      return NextResponse.json(
        { error: "health_status ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const createdPost = await prisma.petRehomePost.create({
      data: {
        user_id,
        phone,
        pet_name,
        type,
        age,
        health_status,
        reason,
        status: PetRehomeStatus.AVAILABLE,
        images: {
          create: imageUrls.map((url) => ({
            image_url: url,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "error" }, { status: 500 });
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

// DELETE - ลบประกาศ
export async function DELETE(req: Request) {
  try {
    const { post_id } = await req.json();

    if (!post_id) {
      return NextResponse.json({ error: "post_id is required" }, { status: 400 });
    }

    const deletedPost = await prisma.petRehomePost.delete({
      where: { post_id },
    });

    return NextResponse.json(deletedPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
