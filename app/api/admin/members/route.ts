import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ดึงสมาชิกทั้งหมด
export async function GET() {
  try {
    const members = await prisma.user.findMany({
      orderBy: { created_at: "asc" },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /members error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลสมาชิกได้" },
      { status: 500 }
    );
  }
}

// แก้ไขชื่อสมาชิก
export async function PUT(req: Request) {
  try {
    const { user_id, name } = await req.json();

    if (!user_id || !name) {
      return NextResponse.json(
        { error: "ต้องระบุ user_id และ name" },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.user.update({
      where: { user_id },
      data: { name },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("PUT /members error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถแก้ไขชื่อสมาชิกได้" },
      { status: 500 }
    );
  }
}

// ลบสมาชิก
export async function DELETE(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // --- ส่วนที่ 1: ลบข้อมูลฝั่ง "ประกาศหาบ้าน" (PetRehome) ---
    // 1.1 ลบรูปของโพสต์หาบ้าน
    await prisma.petRehomeImages.deleteMany({
      where: {
        post: {
          user_id, // ลบรูปของโพสต์ที่เป็นของ User นี้
        },
      },
    });

    // 1.2 ลบโพสต์หาบ้าน
    await prisma.petRehomePost.deleteMany({
      where: { user_id },
    });

    // --- ส่วนที่ 2: ลบข้อมูลฝั่ง "แจ้งพบสัตว์" (AnimalReports) ---
    // 2.1 ลบรูปของการแจ้งพบสัตว์ (ต้องทำผ่านการเช็ค report ที่ user สร้าง)
    await prisma.animalImage.deleteMany({
      where: {
        report: {
          user_id, // ลบรูปที่อยู่ในรายงานของ User นี้
        },
      },
    });

    // 2.2 ลบ Actions (การกดช่วยเหลือ/สถานะ) ที่ User นี้เคยทำ
    // (เช็คก่อนว่ามี Table นี้ไหม ถ้าไม่มีก็ลบบรรทัดนี้ทิ้งได้)
    await prisma.helpAction.deleteMany({
      where: { user_id },
    });

    // 2.3 ลบรายงานการแจ้งพบสัตว์
    await prisma.animalReports.deleteMany({
      where: { user_id },
    });

    // --- ส่วนที่ 3: ลบ User ---
    // หลังจากลบข้อมูลขยะทุกอย่างหมดแล้ว ถึงจะลบ User ได้
    await prisma.user.delete({
      where: { user_id },
    });

    return NextResponse.json({ message: "ลบสมาชิกและข้อมูลทั้งหมดสำเร็จ" });
  } catch (error) {
    console.error("DELETE /members error:", error);
    // แนะนำให้ return error ตัวจริงออกมาดูด้วย จะได้รู้ว่าติดที่ตารางไหน
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะลบสมาชิก", details: String(error) },
      { status: 500 }
    );
  }
}
