import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// ฟังก์ชันช่วย: จัดการ URL รูปภาพให้เป็น URL เต็ม (Normalized)
const mapImages = (
  images: { id: number; url?: string; image_url?: string }[]
) =>
  images.map((img) => {
    const raw = img.url ?? img.image_url ?? "";
    // ถ้าเป็น relative path ให้เติม BASE_URL
    const normalized = raw.startsWith("http") ? raw : `${BASE_URL}/${raw}`;
    // ส่งกลับเป็น { id, url } เพื่อให้สอดคล้องกับ client interface
    return { id: img.id, url: normalized };
  });

// 📍 GET /api/admin/posts/[id]?type=pet หรือ type=report
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ ต้อง await ก่อนใช้
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    if (type === "pet") {
      const post = await prisma.petRehomePost.findUnique({
        where: { post_id: Number(id) },
        include: {
          user: {
            select: { name: true, email: true },
          },
          images: true,
        },
      });

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }
      // ✅ Map enum -> ข้อความภาษาไทย
      const vaccinationMap: Record<string, string> = {
        VACCINATED: "ฉีดวัคซีนแล้ว",
        NOT_VACCINATED: "ยังไม่ได้ฉีดวัคซีน",
      };

      const neuteredMap: Record<string, string> = {
        NEUTERED: "ทำหมันแล้ว",
        NOT_NEUTERED: "ยังไม่ได้ทำหมัน",
      };

      //จัดรูปแบบข้อมูลให้ standardized สำหรับ frontend
      const formatted = {
        id: post.post_id,
        type: "pet",
        pet_name: post.pet_name,
        title: post.reason,
        address: post.address,
        phone: post.phone,
        contact: post.contact,
        gene: post.type,
        //ส่งออกทั้ง enum + label ไทย
        vaccinationStatus: {
          code: post.vaccination_status,
          label: vaccinationMap[post.vaccination_status] || "ไม่ระบุ",
        },
        neuteredStatus: {
          code: post.neutered_status,
          label: neuteredMap[post.neutered_status] || "ไม่ระบุ",
        },
        sex: post.sex,
        age: post.age,
        status: post.status,
        user: post.user
          ? { id: post.user_id, name: post.user.name ?? post.user.name }
          : null,
        createdAt: post.created_at,
        images: mapImages(post.images),
      };

      return Response.json(formatted);
    }

    if (type === "stray") {
      const post = await prisma.animalReports.findUnique({
        where: { report_id: Number(id) },
        include: {
          user: {
            select: { name: true, email: true },
          },
          images: true,
        },
      });

      if (!post) {
        return Response.json({ error: "Report not found" }, { status: 404 });
      }

      // ✅ จัดรูปแบบข้อมูลให้ standardized
      const formatted = {
        id: post.report_id,
        type: "stray",
        pet_name: post.animal_type,
        address: `${post.latitude}, ${post.longitude}`,
        phone: "-",
        contact: "-",
        gene: post.behavior,
        sex: "-",
        age: "-",
        status: post.status,
        user: post.user
          ? { id: post.user_id, name: post.user.name ?? post.user.name }
          : null,
        createdAt: post.created_at,
        images: post.images,
      };

      return Response.json(formatted);
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("❌ Error fetching post detail:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
