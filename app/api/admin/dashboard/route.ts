import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // ดึงข้อมูลสถิติหลัก
    const [totalPosts, totalUsers, totalReports, totalHelped] =
      await Promise.all([
        prisma.petRehomePost.count(), // จำนวนโพสต์หาบ้าน
        prisma.user.count(), // จำนวนผู้ใช้งานทั้งหมด
        prisma.animalReports.count(), // จำนวนการแจ้งพบสัตว์ไร้บ้าน
        prisma.helpAction.count(), // จำนวนสัตว์ที่ได้รับความช่วยเหลือ
      ]);

    // ✅ ดึงข้อมูลแนวโน้มรายเดือน (จำนวนการแจ้งสัตว์ต่อเดือน)
    const monthlyReports = await prisma.animalReports.groupBy({
      by: ["created_at"],
      _count: { _all: true },
    });

    // แปลงข้อมูลให้เป็นรายเดือน
    const reportsByMonth = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i).toLocaleString("th-TH", { month: "short" }),
      count:
        monthlyReports.filter((r) => new Date(r.created_at).getMonth() === i)
          .length || 0,
    }));

    // ✅ อัตราความสำเร็จในการหาบ้าน (สัตว์ที่มีสถานะ adopted)
    const adoptedCount = await prisma.petRehomePost.count({
      where: { status: "ADOPTED" },
    });
    const successRate =
      totalPosts > 0 ? Math.round((adoptedCount / totalPosts) * 100) : 0;

    // ✅ ดึงข้อมูลสมาชิกใหม่รายเดือน
    const newMembers = await prisma.$queryRaw<
      { month: string; count: number }[]
    >` 
  SELECT 
    TO_CHAR("created_at", 'Mon') AS month,
    COUNT(*) AS count
  FROM "User"
  WHERE "created_at" IS NOT NULL
  GROUP BY month
  ORDER BY MIN("created_at");
`;

    const formattedNewMembers = newMembers.map((item) => ({
      month: item.month,
      count: Number(item.count),
    }));

    // ✅ สมาชิกรายเดือน
    const monthlyUsers = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    // ✅ พื้นที่ที่มีรายงานมากสุด (group โดย latitude/longitude แบบหยาบ)
    const topAreas = await prisma.$queryRawUnsafe<
      { lat: number; lng: number; count: number }[]
    >(`
      SELECT 
        ROUND(latitude::numeric, 2) as lat, 
        ROUND(longitude::numeric, 2) as lng, 
        COUNT(*) as count
      FROM "AnimalReports"
      GROUP BY ROUND(latitude::numeric, 2), ROUND(longitude::numeric, 2)
      ORDER BY count DESC
      LIMIT 5
    `);

    return NextResponse.json({
      totalPosts,
      totalUsers,
      totalReports,
      totalHelped,
      successRate,
      reportsByMonth,
      monthlyUsers,
      topAreas,
      newMembers: formattedNewMembers,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
