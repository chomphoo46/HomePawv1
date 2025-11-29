// app/api/animal-report/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, AnimalReportStatus } from "@prisma/client";

const prisma = new PrismaClient();

// POST - แจ้งพบสัตว์ไร้บ้าน
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const animal_type = formData.get("animalType") as string;
    const description = formData.get("description") as string;
    const behavior = formData.get("behavior") as string;
    const lat = Number(formData.get("lat"));
    const lng = Number(formData.get("lng"));
    const location = formData.get("location") as string;
    const images = formData.getAll("images") as File[];

    if (!animal_type || !description || !behavior || !location) {
      return NextResponse.json({ error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }

    // สร้าง path สำหรับเก็บรูป
    const imageUrls: string[] = [];
    for (const file of images) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name}`;
      const filePath = path.join(process.cwd(), "public/uploads", filename);
      await fs.writeFile(filePath, buffer);
      imageUrls.push(`/uploads/${filename}`);
    }

    // สร้าง report
    const report = await prisma.animalReports.create({
      data: {
        user_id: session.user.id,
        animal_type,
        description,
        behavior,
        location: location,
        status: AnimalReportStatus.STILL_THERE,
        latitude: lat,
        longitude: lng,
        images: {
          create: imageUrls.map((url) => ({ image_url: url })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
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
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE - ลบรายงาน
export async function DELETE(req: Request) {
  try {
    const { report_id } = await req.json();
    if (!report_id) {
      return NextResponse.json(
        { error: "report_id required" },
        { status: 400 }
      );
    }

    const report = await prisma.animalReports.findUnique({
      where: { report_id },
      include: { images: true },
    });

    if (!report) {
      return NextResponse.json({ error: "ไม่พบรายงาน" }, { status: 404 });
    }

    // ลบไฟล์รูปจริง
    for (const img of report.images) {
      const filePath = path.join(process.cwd(), "public", img.image_url);
      try {
        await fs.unlink(filePath);
      } catch (_) {}
    }

    const deleted = await prisma.animalReports.delete({ where: { report_id } });
    return NextResponse.json(deleted, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
