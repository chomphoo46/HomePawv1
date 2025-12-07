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
    // ดึงข้อมูลดิบมาก่อน (ดึงมาเยอะหน่อย เช่น 100 จุด เพื่อเอามาจัดกลุ่มเอง)
    const rawPoints = (await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as count,
        MAX(location) as location_name
      FROM "AnimalReports"
      WHERE location IS NOT NULL
      GROUP BY ROUND(latitude::numeric, 3), ROUND(longitude::numeric, 3) 
      ORDER BY count DESC
      LIMIT 100
    `)) as {
      count: number | bigint | string;
      location_name: string;
    }[];

    // สร้างตัวแปรเก็บยอดรวมรายจังหวัด (Dictionary)
    const provinceStats: Record<string, number> = {};

    // วนลูปเพื่อตัดคำหา "ชื่อจังหวัด" และรวมยอดเข้าด้วยกัน
    rawPoints.forEach((point) => {
      const fullLocation = point.location_name || "";
      let province = "ไม่ระบุ";

      if (fullLocation.includes(",")) {
        const parts = fullLocation.split(",");

        // สูตร: ที่อยู่ Google Maps มักจบด้วย "... , จังหวัด รหัสไปรษณีย์, ประเทศ"
        // เอาส่วน "รองสุดท้าย" (index length - 2)
        if (parts.length >= 2) {
          let targetPart = parts[parts.length - 2].trim();

          // ลบตัวเลขรหัสไปรษณีย์ออก (เช่น "Krung Thep Maha Nakhon 10700" -> "Krung Thep Maha Nakhon")
          // ลบคำว่า Thailand ออกด้วย (กันพลาด)
          province = targetPart
            .replace(/[0-9]/g, "")
            .replace("Thailand", "")
            .trim();
        }
      } else {
        // ถ้าไม่มีลูกน้ำ ก็ใช้ชื่อเต็มไปก่อน
        province = fullLocation;
      }

      // รวมยอด: ถ้าจังหวัดนี้มีอยู่แล้วให้บวกเพิ่ม, ถ้ายังไม่มีให้เริ่มนับใหม่
      const currentCount = Number(point.count);
      if (provinceStats[province]) {
        provinceStats[province] += currentCount;
      } else {
        provinceStats[province] = currentCount;
      }
    });

    // แปลงกลับเป็น Array, เรียงลำดับ, และตัดมาแค่ 5 อันดับแรก
    const topAreas = Object.entries(provinceStats)
      .map(([name, count]) => ({
        location: name, // ชื่อจังหวัดที่ตัดคำแล้ว
        count: count, // ยอดรวมที่บวกกันแล้ว
        lat: 0, // ใส่ค่าหลอกไว้ (เพราะหน้านี้เราเน้นชื่อ ไม่เน้นพิกัดเป๊ะๆ)
        lng: 0,
      }))
      .sort((a, b) => b.count - a.count) // เรียงจากมากไปน้อย
      .slice(0, 5); // เอาแค่ Top 5

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
