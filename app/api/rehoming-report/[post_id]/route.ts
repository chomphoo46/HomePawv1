import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - ดึงข้อมูลโพสต์เดียว
export async function GET(
  req: Request,
  { params }: { params: { post_id: string } }
) {
  try {
    const post = await prisma.petRehomePost.findUnique({
      where: { post_id: Number(params.post_id) },
      include: { images: true, user: true },
    });

    if (!post) {
      return NextResponse.json({ error: "ไม่พบข้อมูลโพสต์" }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PATCH - แก้ไขโพสต์
export async function PATCH(
  req: Request,
  { params }: { params: { post_id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = Number(session.user.id);

    const body = await req.json();
    const { deletedImageIds, images, created_at, ...rest } = body;
    const postId = Number(params.post_id);

    // ตรวจสอบว่าเป็นเจ้าของโพสต์
    const post = await prisma.petRehomePost.findUnique({
      where: { post_id: postId },
    });

    if (!post || post.user_id !== user_id) {
      return NextResponse.json(
        { error: "คุณไม่สามารถแก้ไขโพสต์นี้ได้" },
        { status: 403 }
      );
    }

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData: any = { ...rest };

    if (created_at) {
      updateData.created_at = new Date(created_at);
    }

    if (
      (deletedImageIds && deletedImageIds.length) ||
      (images && images.length)
    ) {
      updateData.images = {
        deleteMany: deletedImageIds?.length
          ? { id: { in: deletedImageIds } }
          : undefined,
        create: images?.length
          ? images.map((url: string) => ({ image_url: url }))
          : undefined,
      };
    }

    const updatedPost = await prisma.petRehomePost.update({
      where: { post_id: postId },
      data: updateData,
      include: { images: true },
    });

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
