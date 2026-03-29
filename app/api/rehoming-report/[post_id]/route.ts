import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึงข้อมูลโพสต์เดียวตาม post_id
export async function GET(
  req: Request,
  context: { params: Promise<{ post_id: string }> }
) {
  try {
    // รับค่า post_id จาก URL และต้อง await ก่อนใช้งาน
    const { post_id } = await context.params;

    // ค้นหาโพสต์จากฐานข้อมูลโดยใช้ post_id
    const post = await prisma.petRehomePost.findUnique({
      where: { post_id: Number(post_id) }, // แปลง post_id เป็น number
      include: {
        images: true, // ดึงรูปภาพของโพสต์
        user: true,   // ดึงข้อมูลผู้โพสต์
      },
    });

    // ถ้าไม่พบข้อมูลโพสต์ ให้ตอบ 404
    if (!post) {
      return NextResponse.json({ error: "ไม่พบข้อมูลโพสต์" }, { status: 404 });
    }

    // ส่งข้อมูลโพสต์กลับเมื่อสำเร็จ
    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    // กรณีเกิดข้อผิดพลาดในระบบ
    console.error("GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH - แก้ไขโพสต์
export async function PATCH(
  req: Request,
  context: { params: Promise<{ post_id: string }> }
) {
  try {
    // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = session.user.id;

    // รับข้อมูลที่ส่งมาจาก frontend
    const body = await req.json();

    // แยกข้อมูลที่เกี่ยวกับรูปภาพและฟิลด์อื่น
    const { deletedImageIds, images, created_at, ...rest } = body;

    // รับค่า post_id จาก URL
    const { post_id } = await context.params;
    const postId = Number(post_id);

    // ตรวจสอบว่าโพสต์มีอยู่จริง
    const post = await prisma.petRehomePost.findUnique({
      where: { post_id: postId },
    });

    // ตรวจสอบว่าเป็นเจ้าของโพสต์หรือไม่
    if (!post || post.user_id !== user_id) {
      return NextResponse.json(
        { error: "คุณไม่สามารถแก้ไขโพสต์นี้ได้" },
        { status: 403 }
      );
    }

    // เตรียมข้อมูลสำหรับอัปเดต โดยเริ่มจากข้อมูลทั่วไป
    const updateData: any = { ...rest };

    // ถ้ามีการแก้ไข created_at ให้แปลงเป็น Date
    if (created_at) {
      updateData.created_at = new Date(created_at);
    }

    // จัดการรูปภาพ (ลบรูปเก่าและเพิ่มรูปใหม่)
    if (
      (deletedImageIds && deletedImageIds.length) ||
      (images && images.length)
    ) {
      updateData.images = {
        // ลบรูปตาม id ที่ส่งมา
        deleteMany: deletedImageIds?.length
          ? { id: { in: deletedImageIds } }
          : undefined,

        // เพิ่มรูปใหม่จาก URL
        create: images?.length
          ? images.map((url: string) => ({ image_url: url }))
          : undefined,
      };
    }

    // อัปเดตโพสต์ในฐานข้อมูล
    const updatedPost = await prisma.petRehomePost.update({
      where: { post_id: postId },
      data: updateData,
      include: { images: true },
    });

    // ส่งข้อมูลที่อัปเดตแล้วกลับไป
    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    // กรณีเกิดข้อผิดพลาดในระบบ
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}