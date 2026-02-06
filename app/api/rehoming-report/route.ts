import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
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

// POST - เพิ่มประกาศ
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const phone = formData.get("phone") as string;
    const pet_name = formData.get("pet_name") as string;
    const type = formData.get("type") as string;
    const age = formData.get("age") as string;
    const sexStr = (formData.get("sex") as string)?.toUpperCase();
    const vaccinationStr = (
      formData.get("vaccination_status") as string
    )?.toUpperCase();
    const neuteredStr = (
      formData.get("neutered_status") as string
    )?.toUpperCase();
    const reason = formData.get("reason") as string;
    const address = formData.get("address") as string;
    const contact = formData.get("contact") as string;
    const images = formData.getAll("images") as File[];

    // ตรวจสอบข้อมูลบังคับ
    if (
      !phone ||
      !pet_name ||
      !type ||
      !sexStr ||
      !age ||
      !vaccinationStr ||
      !neuteredStr ||
      !reason ||
      !address ||
      images.length === 0 ||
      images.length > 5
    ) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }

    if (!/^[0-9]+$/.test(phone)) {
      return NextResponse.json(
        { error: "เบอร์โทรต้องเป็นตัวเลขเท่านั้น" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // ✅ ส่วนที่แก้ไข: เตรียมโฟลเดอร์และจัดการชื่อไฟล์
    // ---------------------------------------------------------
    
    // 1. ระบุ Path ของโฟลเดอร์ public/uploads
    const uploadDir = path.join(process.cwd(), "public/uploads");

    // 2. ตรวจสอบว่ามีโฟลเดอร์ไหม ถ้าไม่มีให้สร้างใหม่ (สำคัญมาก!)
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const imageUrls: string[] = [];

    for (const file of images) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 3. ตั้งชื่อไฟล์ใหม่ (ลบช่องว่าง, ลบภาษาไทย, ป้องกันชื่อไฟล์แปลกๆ)
      // เช่น "My Dog.jpg" -> "173824567-My_Dog.jpg"
      const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9.\-_]/g, "");
      const filename = `${Date.now()}-${safeName}`;
      
      const filePath = path.join(uploadDir, filename);

      // 4. บันทึกไฟล์
      await fs.writeFile(filePath, buffer);

      // 5. เก็บ URL (ต้องเริ่มด้วย /uploads/...)
      imageUrls.push(`/uploads/${filename}`);
    }
    // ---------------------------------------------------------

    // แปลง Enum
    const vaccination_status =
      VaccinationStatus[vaccinationStr as keyof typeof VaccinationStatus];
    if (!vaccination_status) {
      return NextResponse.json(
        { error: "vaccination_status ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const neutered_status =
      NeuteredStatus[neuteredStr as keyof typeof NeuteredStatus];
    if (!neutered_status) {
      return NextResponse.json(
        { error: "neutered_status ไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    
    let sexEnum: PetSex;
    if (sexStr === "MALE") {
      sexEnum = PetSex.MALE;
    } else if (sexStr === "FEMALE") {
      sexEnum = PetSex.FEMALE;
    } else {
      return NextResponse.json({ error: "sex ไม่ถูกต้อง" }, { status: 400 });
    }

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
          create: imageUrls.map((url) => ({
            image_url: url,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// GET - ดึงประกาศทั้งหมด
export async function GET() {
  try {
    const posts = await prisma.petRehomePost.findMany({
      orderBy: { created_at: "desc" },
      include: {
        images: true, // ✅ แก้เป็นดึงรูปทั้งหมด (เผื่อหน้า Frontend อยากโชว์ Gallery)
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
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

    const post = await prisma.petRehomePost.findUnique({
      where: { post_id },
      include: { images: true },
    });

    if (!post) {
      return NextResponse.json({ error: "ไม่พบโพสต์" }, { status: 404 });
    }

    // ลบไฟล์จริงออกจากเครื่อง
    for (const img of post.images) {
      // img.image_url คือ "/uploads/xxxxx.jpg"
      // ต้องเติม process.cwd() + "public" เข้าไปข้างหน้า
      const filePath = path.join(process.cwd(), "public", img.image_url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(`⚠️ ลบไฟล์ไม่สำเร็จ (อาจจะไม่มีไฟล์อยู่แล้ว): ${filePath}`);
      }
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