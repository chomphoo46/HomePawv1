import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ดึง userId จาก session ของผู้ใช้ที่ล็อกอิน
    const userId = session.user.id;

    // ค้นหารายการคำขอรับเลี้ยงทั้งหมดของผู้ใช้คนนี้
    const myRequests = await prisma.adoptionRequest.findMany({
      where: {
        user_id: userId,
      },
      include: {
        // ดึงข้อมูลโพสต์ที่ผู้ใช้เคยส่งคำขอไปด้วย
        post: {
          include: {
            // ดึงรูปภาพของโพสต์นั้นมาด้วย
            images: true,
          },
        },
      },
      // เรียงข้อมูลจากคำขอล่าสุดไปเก่าสุด
      orderBy: {
        created_at: "desc",
      },
    });

    // ส่งข้อมูลกลับไปยัง frontend
    return NextResponse.json(myRequests, { status: 200 });
  } catch (error) {
    // กรณีเกิดข้อผิดพลาดในระบบ
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}