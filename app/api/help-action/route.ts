import { NextResponse } from "next/server";
import { PrismaClient, HelpActionType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบสิทธิ์ (Authentication)
    // ดึง session ของผู้ใช้ที่ล็อกอินอยู่
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // ถ้าไม่ล็อกอิน, ไม่อนุญาตให้ทำต่อ
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. ตรวจสอบข้อมูล (Validation)
    const body = await req.json();
    const { report_id, action_type } = body;

    // เช็คว่ามีข้อมูลที่จำเป็นครบถ้วน
    if (!report_id || !action_type) {
      return NextResponse.json(
        { error: "Missing required fields (report_id, action_type)" },
        { status: 400 }
      );
    }

    // เช็คว่า report_id เป็นตัวเลข
    if (typeof report_id !== "number") {
      return NextResponse.json(
        { error: "Invalid report_id (must be a number)" },
        { status: 400 }
      );
    }

    // เช็คว่า action_type ที่ส่งมา ตรงกับ enum ใน Prisma
    if (
      action_type !== HelpActionType.FEED &&
      action_type !== HelpActionType.ADOPT
    ) {
      return NextResponse.json(
        { error: "Invalid action_type (must be FEED or ADOPT)" },
        { status: 400 }
      );
    }

    // 3. บันทึกข้อมูล (Database Action)
    // สร้าง record ใหม่ในตาราง HelpAction
    const newAction = await prisma.helpAction.create({
      data: {
        report_id: report_id,
        action_type: action_type, // (action_type ที่ผ่านการตรวจสอบแล้ว)
        user_id: session.user.id, // (user_id จาก session ที่ล็อกอิน)
      },
    });

    // 4. ส่งคำตอบ (Success Response)
    return NextResponse.json(
      { success: true, action: newAction },
      { status: 201 }
    ); // 201 = Created
  } catch (error) {
    // 5. จัดการข้อผิดพลาด (Error Handling)
    console.error("Error creating help action:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // ดึงข้อมูล HelpAction ทั้งหมด (เพื่อใช้นับจำนวน)
    const actions = await prisma.helpAction.findMany();

    return NextResponse.json(actions, { status: 200 });
  } catch (error) {
    console.error("Error fetching help actions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
