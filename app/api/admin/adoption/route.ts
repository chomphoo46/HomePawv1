import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: เหมือนเดิม (ดึงรายการคำขอทั้งหมด)
export async function GET() {
  try {
    const requests = await prisma.adoptionRequest.findMany({
      include: {
        user: true,
        post: {     
          include: {
            images: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// 2. PATCH: อัปเดตสถานะ พร้อมเหตุผล (reason)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    // รับค่า reason เพิ่มเข้ามาจาก Frontend
    const { requestId, status, postId, reason } = body; 

    // กรณี "อนุมัติ" (APPROVED)
    if (status === 'APPROVED') {
      await prisma.$transaction([
        // 1. อัปเดตคำขอ: เปลี่ยนสถานะ + ใส่เหตุผล
        prisma.adoptionRequest.update({
          where: { id: requestId },
          data: { 
            status: 'APPROVED',
            reason: reason
          }
        }),
        // 2. อัปเดตโพสต์: เปลี่ยนสถานะสัตว์เป็น ADOPTED
        prisma.petRehomePost.update({
          where: { post_id: postId },
          data: { status: 'ADOPTED' }
        })
      ]);
    } else {
      // กรณี "ปฏิเสธ" (REJECTED) หรืออื่นๆ
      await prisma.adoptionRequest.update({
        where: { id: requestId },
        data: {
            status: status,
            reason: reason
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}