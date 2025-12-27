import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. ดึงข้อมูลสถิติหลัก
    const [totalPosts, totalUsers, totalReports, totalHelped] =
      await Promise.all([
        prisma.petRehomePost.count(),
        prisma.user.count(),
        prisma.animalReports.count(),
        prisma.helpAction.count(),
      ]);

    // 2. ✅ ดึงข้อมูลแนวโน้มรายเดือน (แก้จาก groupBy timestamp เป็น Raw Query เพื่อประสิทธิภาพ)
    // การ group by created_at ใน prisma ตรงๆ จะได้ทุก record แยกกัน ทำให้ช้าและ memory เต็มง่าย
    const rawMonthlyReports = (await prisma.$queryRaw`
      SELECT 
        TO_CHAR("created_at", 'Mon') AS month,
        EXTRACT(MONTH FROM "created_at") as month_num,
        COUNT(*)::int AS count
      FROM "AnimalReports"
      WHERE "created_at" IS NOT NULL
      GROUP BY month, month_num
      ORDER BY month_num
    `) as {
      month: string;
      month_num: number | string;
      count: number | bigint | string;
    }[];

    // แปลง format ให้ตรงกับที่ frontend ต้องการ (12 เดือน)
    const reportsByMonth = Array.from({ length: 12 }, (_, i) => {
      const monthName = new Date(2025, i).toLocaleString("en-US", {
        month: "short",
      }); // หรือ "th-TH"
      const found = rawMonthlyReports.find(
        (r) => Number(r.month_num) === i + 1
      );
      return {
        month: monthName,
        reports: found ? Number(found.count) : 0,
      };
    });

    // 3. อัตราความสำเร็จ
    const adoptedCount = await prisma.petRehomePost.count({
      where: { status: "ADOPTED" },
    });
    const successRate =
      totalPosts > 0 ? Math.round((adoptedCount / totalPosts) * 100) : 0;

    // 4. สมาชิกใหม่รายเดือน
    const newMembersRaw = (await prisma.$queryRaw` 
      SELECT 
        TO_CHAR("created_at", 'Mon') AS month,
        EXTRACT(MONTH FROM "created_at") as month_num,
        COUNT(*) AS count
      FROM "User"
      WHERE "created_at" IS NOT NULL
      GROUP BY month, month_num
      ORDER BY month_num;
    `) as {
      month: string;
      month_num: number | string;
      count: number | bigint | string;
    }[];

    const formattedNewMembers = newMembersRaw.map((item) => ({
      month: item.month,
      count: Number(item.count), // แปลง BigInt เป็น Number
    }));

    // 5. สมาชิกแบ่งตาม Role
    const monthlyUsers = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    // 6. พื้นที่ที่มีรายงานมากสุด (ฉบับรวมยอดตามจังหวัด)
    const rawReports = await prisma.animalReports.findMany({
      where: {
        location: { not: null },
      },
      select: {
        location: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 1000,
    });

    const provinceStats: Record<string, number> = {};

    rawReports.forEach((report) => {
      const fullLocation = report.location || "";
      let province = "ไม่ระบุ";
      let cleanText = fullLocation
        .replace(/Thailand/gi, "")
        .replace(/ประเทศไทย/g, "")
        .replace(/[0-9]/g, "") 
        .trim();

      if (cleanText.includes(",")) {
        const parts = cleanText.split(",").map(s => s.trim()).filter(s => s !== "");
        province = parts[parts.length - 1]; 
      } 
      else {
        const words = cleanText.split(/\s+/).filter(w => w !== ""); 
        if (words.length > 0) {
          province = words[words.length - 1];
        } else {
          province = fullLocation;
        }
      }
      province = province
        .replace(/^(จ\.|จังหวัด)/, "")
        .replace(/Province/i, "")
        .trim();

      if (province.length > 30) {
         province = province.substring(0, 20) + "...";
      }

      if (!province) province = "ไม่ระบุ";

      // รวมยอด
      if (provinceStats[province]) {
        provinceStats[province]++;
      } else {
        provinceStats[province] = 1;
      }
    });

    // แปลงเป็น Array, เรียงลำดับ, และตัดมาแค่ 5 อันดับ
    const topAreas = Object.entries(provinceStats)
      .map(([location, count]) => ({
        location, // ชื่อที่ Clean แล้ว
        count,
        lat: 0, // ค่าหลอก (Frontend หน้านี้ไม่ได้ใช้พิกัดแล้ว)
        lng: 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalPosts,
      totalUsers,
      totalReports,
      totalHelped,
      successRate,
      monthlyData: reportsByMonth,
      monthlyUsers,
      topAreas,
      newMembers: formattedNewMembers,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // แนะนำให้ return error message ออกมาดูด้วย เพื่อ debug ง่ายขึ้น
    return NextResponse.json(
      { error: "Failed to load dashboard data", details: String(error) },
      { status: 500 }
    );
  }
}
