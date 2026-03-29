import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: ดึงข้อมูลโพสต์ตาม id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params เป็น async ต้อง await ก่อนใช้
) {
  try {
    const { id } = await params; // ดึง id จาก URL เช่น /api/rehome/1

    const post = await prisma.petRehomePost.findUnique({
      where: { post_id: Number(id) }, // แปลง id เป็น number เพราะ DB ใช้ number
    });

    // ถ้าไม่พบข้อมูล ให้ตอบ 404 Not Found
    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    // ดึงข้อมูลสำเร็จ → 200 OK
    return Response.json(post, { status: 200 });
  } catch (error) {
    // ถ้าเกิด error เช่น database ล่ม → 500
    return new Response("Internal Server Error", { status: 500 });
  }
}

// 🔹 PUT: แก้ไขข้อมูลโพสต์ตาม id
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ดึง id จาก URL
    const body = await req.json(); // รับข้อมูลใหม่จาก request

    const updated = await prisma.petRehomePost.update({
      where: { post_id: Number(id) }, // หา record ที่จะแก้
      data: body, // ใช้ข้อมูลใหม่อัปเดต
    });

    // อัปเดตสำเร็จ 200 OK
    return Response.json(updated, { status: 200 });
  } catch (error) {
    // ถ้า update ไม่สำเร็จ เช่น id ไม่มี จะเข้า catch
    return new Response("Internal Server Error", { status: 500 });
  }
}

// 🔹 DELETE: ลบโพสต์ตาม id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ดึง id จาก URL

    await prisma.petRehomePost.delete({
      where: { post_id: Number(id) }, // ลบข้อมูลตาม id
    });

    // ลบสำเร็จ 204 No Content (ไม่มี body กลับ)
    return new Response(null, { status: 204 });
  } catch (error) {
    // ถ้าเกิด error เช่น id ไม่มี → 500
    return new Response("Internal Server Error", { status: 500 });
  }
}