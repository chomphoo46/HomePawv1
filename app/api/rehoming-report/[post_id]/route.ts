// app/api/rehoming-report/[post_id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { post_id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = Number(session.user.id);

    const body = await req.json();
    const { images, deleteImageIds, ...rest } = body;

    // ตรวจสอบว่าโพสต์นี้เป็นของ user
    const post = await prisma.petRehomePost.findUnique({
      where: { post_id: Number(params.post_id) },
    });

    if (!post || post.user_id !== user_id) {
      return NextResponse.json(
        { error: "คุณไม่สามารถแก้ไขโพสต์นี้ได้" },
        { status: 403 }
      );
    }

    // อัปเดตโพสต์
    const updated = await prisma.petRehomePost.update({
      where: { post_id: Number(params.post_id) },
      data: {
        ...rest,
        images: {
          // ลบรูปเก่า (ถ้ามี)
          deleteMany: deleteImageIds?.length
            ? { image_id: { in: deleteImageIds } }
            : undefined,

          // เพิ่มรูปใหม่ (ถ้ามี)
          create: images?.length
            ? images.map((url: string) => ({ image_url: url }))
            : undefined,
        },
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
