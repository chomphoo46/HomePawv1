// app/api/rehome/my-posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึงโพสต์ของผู้ใช้ปัจจุบัน
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = Number(session.user.id);

    const posts = await prisma.petRehomePost.findMany({
      where: { user_id },
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
      return NextResponse.json({ error: "post_id is required" }, { status: 400 });
    }

    // ตรวจสอบว่าโพสต์เป็นของผู้ใช้นี้
    const post = await prisma.petRehomePost.findUnique({ where: { post_id } });
    if (!post || post.user_id !== user_id) {
      return NextResponse.json({ error: "คุณไม่สามารถลบโพสต์นี้ได้" }, { status: 403 });
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
