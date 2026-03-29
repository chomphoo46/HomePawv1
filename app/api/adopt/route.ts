import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // รับข้อมูลจาก frontend
    const body = await req.json();
    console.log("Adoption Request Body:", body);
    const { postId, name, contactInfo, note } = body;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!postId || !name || !contactInfo) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    // ตรวจสอบว่าผู้ใช้เคยส่งคำขอสำหรับสัตว์ตัวนี้แล้วหรือไม่
    // เฉพาะกรณีที่ยังอยู่ในสถานะ PENDING หรือ APPROVED
    const existingRequest = await prisma.adoptionRequest.findFirst({
      where: {
        user_id: session.user.id, // ใช้ user_id จาก session ที่ล็อกอิน
        post_id: postId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    // ถ้ามีคำขออยู่แล้ว ไม่ให้ส่งซ้ำ
    if (existingRequest) {
      return NextResponse.json(
        { message: "คุณได้ส่งคำขอสำหรับน้องตัวนี้ไปแล้ว" },
        { status: 409 },
      );
    }

    // ตรวจสอบว่าสัตว์ยังเปิดให้รับเลี้ยงอยู่หรือไม่
    const petPost = await prisma.petRehomePost.findUnique({
      where: { post_id: postId },
    });

    // ไม่ให้เจ้าของโพสต์ส่งคำขอรับเลี้ยงสัตว์ของตัวเอง
    if (petPost?.user_id === session.user.id) {
      return NextResponse.json(
        { message: "คุณไม่สามารถส่งคำขอรับเลี้ยงสัตว์ที่คุณเป็นเจ้าของได้" },
        { status: 400 }
      );
    }

    // ถ้าไม่มีโพสต์ หรือสถานะเป็น ADOPTED แล้ว
    if (!petPost || petPost.status === "ADOPTED") {
      return NextResponse.json(
        { message: "เสียใจด้วย น้องได้บ้านใหม่ไปแล้ว" },
        { status: 400 },
      );
    }

    // บันทึกคำขอลงฐานข้อมูล โดยตั้งสถานะเริ่มต้นเป็น PENDING
    const newRequest = await prisma.adoptionRequest.create({
      data: {
        user_id: session.user.id, // ใช้ user_id จาก session ที่ล็อกอิน
        post_id: postId,
        name: name,
        contact_info: contactInfo,
        note: note,
        status: "PENDING",
      },
    });

    // ส่งผลลัพธ์เมื่อสร้างสำเร็จ
    return NextResponse.json(
      { message: "ส่งคำขอสำเร็จ", data: newRequest },
      { status: 201 },
    );
  } catch (error) {
    // กรณีเกิดข้อผิดพลาดในระบบ
    console.error("Adoption Request Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
