import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// GET - ดึงรายการแจ้งพบสัตว์
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = session.user.id;

    const reports = await prisma.animalReports.findMany({
      where: { user_id: String(user_id) },
      orderBy: { created_at: "desc" },
      include: {
        images: true,
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching animal reports:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 }
    );
  }
}

// DELETE - ลบรายการแจ้งพบ
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = session.user.id;

    const { report_id } = await req.json();

    if (!report_id) {
      return NextResponse.json(
        { error: "report_id is required" },
        { status: 400 }
      );
    }

    const report = await prisma.animalReports.findUnique({
      where: { report_id },
    });
    if (!report || report.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่สามารถลบโพสต์นี้ได้" },
        { status: 403 }
      );
    }

    await prisma.animalImage.deleteMany({
      where: { report_id },
    });

    const deletedReport = await prisma.animalReports.delete({
      where: { report_id },
    });

    // สั่งรีเฟรชหน้าจอเมื่อลบข้อมูล
    revalidatePath("/");
    revalidatePath("/profile");

    return NextResponse.json(deletedReport, { status: 200 });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH - แก้ไขข้อมูลแจ้งพบ
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = session.user.id;

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

    if (!report_id) {
      return NextResponse.json(
        { error: "report_id is required" },
        { status: 400 }
      );
    }

    const report = await prisma.animalReports.findUnique({
      where: { report_id },
    });
    if (!report || report.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์แก้ไขโพสต์นี้" },
        { status: 403 }
      );
    }

    const updatedReport = await prisma.animalReports.update({
      where: { report_id },
      data: {
        ...(animal_type && { animal_type }),
        ...(description && { description }),
        ...(behavior && { behavior }),
        ...(location && { location }),
        ...(status && { status }),
        ...(latitude && { latitude: Number(latitude) }),
        ...(longitude && { longitude: Number(longitude) }),
      },
    });

    revalidatePath("/"); // หน้า Home จะเห็นหมุดย้ายที่ทันที
    revalidatePath("/profile"); // หน้า Profile ข้อมูลก็จะอัปเดตด้วย
    revalidatePath(`/animal-report/${report_id}`); // หน้ารายละเอียดเฉพาะโพสต์

    return NextResponse.json(updatedReport, { status: 200 });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
