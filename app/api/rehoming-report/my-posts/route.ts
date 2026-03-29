import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึงโพสต์ทั้งหมดของผู้ใช้ที่ล็อกอินอยู่
export async function GET() {
  try {
    // ตรวจสอบว่า user login อยู่หรือไม่
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ใช้ user_id จาก session เพื่อดึงเฉพาะโพสต์ของเจ้าของที่ล็อกอิน
    const user_id = session.user.id;

    const posts = await prisma.petRehomePost.findMany({
      where: { user_id: String(user_id) },
      orderBy: { created_at: "desc" }, // เรียงจากใหม่ไปเก่า
      include: {
        images: true, // ดึงรูปภาพของโพสต์มาด้วย
        user: { select: { name: true, email: true } }, // ดึงข้อมูลผู้โพสต์บางส่วน
      },
    });

    // ส่งข้อมูลโพสต์กลับ
    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE - ลบโพสต์ของผู้ใช้ปัจจุบัน พร้อมรูปภาพที่เกี่ยวข้อง
export async function DELETE(req: Request) {
  try {
    // ตรวจสอบว่า user login อยู่หรือไม่
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = session.user.id;

    // รับ post_id จาก request body
    const { post_id } = await req.json();
    if (!post_id) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบก่อนว่าโพสต์นี้มีอยู่จริง และเป็นของ user คนที่ล็อกอินหรือไม่
    const post = await prisma.petRehomePost.findUnique({ where: { post_id } });

    if (!post || post.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่สามารถลบโพสต์นี้ได้" },
        { status: 403 }
      );
    }

    // ลบรูปภาพทั้งหมดที่ผูกกับโพสต์นี้ก่อน
    await prisma.petRehomeImages.deleteMany({
      where: { post_id },
    });

    // จากนั้นลบโพสต์หลัก
    const deletedPost = await prisma.petRehomePost.delete({
      where: { post_id },
    });

    return NextResponse.json(deletedPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH - แก้ไขโพสต์ของผู้ใช้ปัจจุบัน
export async function PATCH(req: Request) {
  try {
    // ตรวจสอบว่า user login อยู่หรือไม่
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = session.user.id;

    // รับข้อมูลที่ต้องการแก้ไขจาก frontend
    const body = await req.json();
    const {
      post_id,
      pet_name,
      phone,
      type,
      sex,
      age,
      vaccination_status,
      neutered_status,
      address,
      contact,
      reason,
      status,
    } = body;

    // ต้องมี post_id เพื่อรู้ว่าจะอัปเดตโพสต์ไหน
    if (!post_id) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าโพสต์นี้มีอยู่จริง
    const post = await prisma.petRehomePost.findUnique({
      where: { post_id },
    });

    if (!post) {
      return NextResponse.json({ error: "ไม่พบโพสต์" }, { status: 404 });
    }

    // ตรวจสอบสิทธิ์ว่าเป็นเจ้าของโพสต์จริงหรือไม่
    if (post.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์แก้ไขโพสต์นี้" },
        { status: 403 }
      );
    }

    // อัปเดตเฉพาะ field ที่ถูกส่งมา (Partial Update)
    const updatedPost = await prisma.petRehomePost.update({
      where: { post_id },
      data: {
        ...(pet_name && { pet_name }),
        ...(phone && { phone }),
        ...(type && { type }),
        ...(sex && { sex }),
        ...(age && { age }),
        ...(vaccination_status && { vaccination_status }),
        ...(neutered_status && { neutered_status }),
        ...(address && { address }),
        ...(contact && { contact }),
        ...(reason && { reason }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}