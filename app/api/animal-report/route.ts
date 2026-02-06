import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, AnimalReportStatus } from "@prisma/client";

const prisma = new PrismaClient();

// POST - แจ้งพบสัตว์ไร้บ้าน (เวอร์ชันรับ JSON URL จาก Vercel Blob)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // รับค่าเป็น JSON ทั้งหมด (รวมถึง URLs รูปภาพที่อัปโหลดเข้า Blob ไปก่อนหน้านี้)
    const body = await req.json();
    const { 
      animalType, 
      description, 
      behavior, 
      lat, 
      lng, 
      location, 
      images // Array ของ URL: ["https://...", "https://..."]
    } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!animalType || !description || !behavior || !location || !images || images.length === 0) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // บันทึกลงฐานข้อมูล Neon
    const report = await prisma.animalReports.create({
      data: {
        user_id: session.user.id,
        animal_type: animalType,
        description,
        behavior,
        location: location,
        status: AnimalReportStatus.STILL_THERE,
        latitude: Number(lat),
        longitude: Number(lng),
        images: {
          create: images.map((url: string) => ({ image_url: url })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลได้" }, { status: 500 });
  }
}

// GET - ดึงรายงานทั้งหมด
export async function GET() {
  try {
    const reports = await prisma.animalReports.findMany({
      orderBy: { created_at: "desc" },
      include: {
        images: true,
        user: {
          select: { name: true, email: true },
        },
        actions: {
          orderBy: { created_at: "desc" },
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });
    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}