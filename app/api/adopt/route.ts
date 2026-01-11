import { NextResponse } from "next/server";
import { PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Adoption Request Body:", body);
    const { userId, postId, name, contactInfo, note } = body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!userId || !postId) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // 2. เช็คว่า User นี้เคยขอตัวนี้ไปหรือยัง (สถานะ PENDING หรือ APPROVED)
    const existingRequest = await prisma.adoptionRequest.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: "คุณได้ส่งคำขอสำหรับน้องตัวนี้ไปแล้ว" },
        { status: 409 }
      );
    }

    // 3. เช็คว่าน้องยังว่างอยู่ไหม (เผื่อมีคนอื่นชิง Adopt ไปแล้วและ Admin อนุมัติไปแล้ว)
    const petPost = await prisma.petRehomePost.findUnique({
      where: { post_id: postId },
    });

    if (!petPost || petPost.status === "ADOPTED") {
      return NextResponse.json(
        { message: "เสียใจด้วย น้องได้บ้านใหม่ไปแล้ว" },
        { status: 400 }
      );
    }

    // 4. บันทึกคำขอลง Database
    const newRequest = await prisma.adoptionRequest.create({
      data: {
        user_id: userId,
        post_id: postId,
        name: name,
        contact_info: contactInfo,
        note: note,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { message: "ส่งคำขอสำเร็จ", data: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Adoption Request Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
