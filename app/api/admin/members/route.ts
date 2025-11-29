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

    // ลบรูปทั้งหมดของโพสต์ที่ user เคยสร้าง
    await prisma.petRehomeImages.deleteMany({
      where: {
        post: {
          user_id,
        },
      },
    });

    // ลบโพสต์ทั้งหมดของ user
   
    await prisma.petRehomePost.deleteMany({
      where: { user_id },
    });

    // ลบ user
    await prisma.user.delete({
      where: { user_id },
    });

    return NextResponse.json({ message: "ลบสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("DELETE /members error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะลบสมาชิก" },
      { status: 500 }
    );
  }
}
