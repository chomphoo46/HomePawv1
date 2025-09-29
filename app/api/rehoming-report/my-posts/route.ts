// app/api/rehome/my-posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PetSex, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึงโพสต์ของผู้ใช้ปัจจุบัน
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = session.user.id;

    const posts = await prisma.petRehomePost.findMany({
      where: { user_id: String(user_id) },
      orderBy: { created_at: "desc" },
      include: {
        images: true,
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE - ลบโพสต์ของผู้ใช้ปัจจุบัน พร้อมรูปภาพ
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = Number(session.user.id);

    const { post_id } = await req.json();
    if (!post_id) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าโพสต์เป็นของผู้ใช้นี้
    const post = await prisma.petRehomePost.findUnique({ where: { post_id } });
    if (!post || post.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่สามารถลบโพสต์นี้ได้" },
        { status: 403 }
      );
    }

    // ลบรูปภาพทั้งหมดของโพสต์ก่อน
    await prisma.petRehomeImages.deleteMany({
      where: { post_id },
    });

    // ลบโพสต์
    const deletedPost = await prisma.petRehomePost.delete({
      where: { post_id },
    });

    return NextResponse.json(deletedPost, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH = แก้ไขโพสต์
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = Number(session.user.id);

    // ดึงค่าที่ส่งมาจาก frontend
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

    if (!post_id) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าโพสต์นี้มีจริงและเป็นของ user ที่ล็อกอิน
    const post = await prisma.petRehomePost.findUnique({
      where: { post_id },
    });

    if (!post) {
      return NextResponse.json({ error: "ไม่พบโพสต์" }, { status: 404 });
    }

    if (post.user_id !== String(user_id)) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์แก้ไขโพสต์นี้" },
        { status: 403 }
      );
    }

    // อัปเดตโพสต์ (เฉพาะฟิลด์ที่ส่งมา ไม่บังคับต้องใส่ทั้งหมด)
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
