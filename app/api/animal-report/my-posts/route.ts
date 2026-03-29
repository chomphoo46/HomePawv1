import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// GET - ดึงรายการแจ้งพบของผู้ใช้ที่ล็อกอิน
export async function GET() {
  try {
    // ตรวจสอบว่า user login อยู่หรือไม่
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ใช้ user_id จาก session เพื่อดึงเฉพาะรายการของตัวเอง
    const user_id = session.user.id;

    const reports = await prisma.animalReports.findMany({
      where: { user_id: String(user_id) }, // ดึงเฉพาะของผู้ใช้คนนี้
      orderBy: { created_at: "desc" },     // เรียงจากใหม่ไปเก่า
      include: {
        images: true, // ดึงรูปภาพที่ผูกกับรายงาน
      },
    });

    // ส่งข้อมูลสำเร็จ
    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error("Error fetching animal reports:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// DELETE - ลบรายการแจ้งพบของผู้ใช้ พร้อมรูปภาพ
export async function DELETE(req: Request) {
  try {
    // ตรวจสอบว่า user login อยู่หรือไม่
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = session.user.id;

    // รับ report_id จาก request body
    const { report_id } = await req.json();

    // ต้องมี report_id
    if (!report_id) {
      return NextResponse.json(
        { error: "report_id is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าโพสต์มีอยู่จริง และเป็นของผู้ใช้คนนี้
    const report = await prisma.animalReports.findUnique({
      where: { report_id },
    });

    if (!report || report.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่สามารถลบโพสต์นี้ได้" },
        { status: 403 }
      );
    }

    // ลบรูปภาพที่เกี่ยวข้องก่อน (กันปัญหา foreign key)
    await prisma.animalImage.deleteMany({
      where: { report_id },
    });

    // ลบข้อมูลหลักของรายงาน
    const deletedReport = await prisma.animalReports.delete({
      where: { report_id },
    });

    // สั่ง revalidate หน้า เพื่อให้ UI อัปเดตข้อมูลล่าสุด
    revalidatePath("/");
    revalidatePath("/profile");

    // ส่งผลลัพธ์กลับเมื่อสำเร็จ
    return NextResponse.json(deletedReport, { status: 200 });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH - แก้ไขข้อมูลแจ้งพบ
export async function PATCH(req: Request) {
  try {
    // ตรวจสอบว่า user login อยู่หรือไม่
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = session.user.id;

    // รับข้อมูลจาก frontend
    const body = await req.json();

    const {
      report_id,
      animal_type,
      description,
      behavior,
      location,
      status,
      latitude,
      longitude,
    } = body;

    // ต้องมี report_id เพื่อระบุว่าจะอัปเดตรายการไหน
    if (!report_id) {
      return NextResponse.json(
        { error: "report_id is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าโพสต์มีอยู่จริง และเป็นของผู้ใช้คนนี้
    const report = await prisma.animalReports.findUnique({
      where: { report_id },
    });

    if (!report || report.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์แก้ไขโพสต์นี้" },
        { status: 403 }
      );
    }

    // อัปเดตเฉพาะฟิลด์ที่ถูกส่งมา (partial update)
    const updatedReport = await prisma.animalReports.update({
      where: { report_id },
      data: {
        ...(animal_type && { animal_type }),
        ...(description && { description }),
        ...(behavior && { behavior }),
        ...(location && { location }),
        ...(status && { status }),
        ...(latitude && { latitude: Number(latitude) }),   // แปลงเป็น number
        ...(longitude && { longitude: Number(longitude) }), // แปลงเป็น number
      },
    });

    // revalidate หน้าเพื่อให้ข้อมูลอัปเดตทันที
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath(`/animal-report/${report_id}`);

    return NextResponse.json(updatedReport, { status: 200 });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}