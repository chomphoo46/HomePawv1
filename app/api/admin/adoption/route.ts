import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ตรวจสอบ path prisma ของคุณ

// 1. GET: ดึงรายการคำขอทั้งหมด
export async function GET() {
  try {
    const requests = await prisma.adoptionRequest.findMany({
      include: {
        user: true, // ดึงข้อมูลคนขอ
        post: {     
          include: {
            images: true // ดึงรูปสัตว์
          }
        }
      },
      orderBy: {
        created_at: 'desc' // ใหม่สุดขึ้นก่อน
      }
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// 2. PATCH: อัปเดตสถานะ (อนุมัติ/ปฏิเสธ)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { requestId, status, postId } = body;

    // ถ้ากด "อนุมัติ" (APPROVED)
    if (status === 'APPROVED') {
      // ใช้ Transaction เพื่อทำ 2 อย่างพร้อมกัน:
      // 1. เปลี่ยนสถานะคำขอเป็น APPROVED
      // 2. เปลี่ยนสถานะสัตว์เป็น ADOPTED (ได้บ้านแล้ว)
      await prisma.$transaction([
        prisma.adoptionRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' }
        }),
        prisma.petRehomePost.update({
          where: { post_id: postId },
          data: { status: 'ADOPTED' }
        })
      ]);
    } else {
      // ถ้ากด "ปฏิเสธ" หรืออื่นๆ แค่อัปเดตคำขออย่างเดียว
      await prisma.adoptionRequest.update({
        where: { id: requestId },
        data: { status: status }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}