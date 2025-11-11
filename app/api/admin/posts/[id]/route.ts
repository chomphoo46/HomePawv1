import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// ✅ Map enum -> ข้อความภาษาไทย
const vaccinationMap: Record<string, string> = {
  VACCINATED: "ฉีดวัคซีนแล้ว",
  NOT_VACCINATED: "ยังไม่ได้ฉีดวัคซีน",
};

const neuteredMap: Record<string, string> = {
  NEUTERED: "ทำหมันแล้ว",
  NOT_NEUTERED: "ยังไม่ได้ทำหมัน",
};

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
        images: mapImages(post.images),
      };

      return Response.json(formatted);
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("❌ Error fetching post detail:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ PATCH: แก้ไขโพสต์ (ฉบับสมบูรณ์ + รองรับอัปเดตรูป)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params;
    const id = Number(paramId);
    const { payload }: { payload: { type: string; [key: string]: any } } =
      await req.json();

    if (!id || !payload || !payload.type) {
      return NextResponse.json(
        { error: "Invalid data or type missing" },
        { status: 400 }
      );
    }

    let post;

    if (payload.type === "pet") {
      // ✅ อัปเดตข้อมูลหลัก
      post = await prisma.petRehomePost.update({
        where: { post_id: id },
        data: {
          reason: payload.title,
          status: payload.status,
          contact: payload.contact,
          phone: payload.phone,
          address: payload.address,
          pet_name: payload.pet_name,
          type: payload.gene,
          sex: payload.sex,
          age: payload.age,
          vaccination_status: payload.vaccinationStatus.code,
          neutered_status: payload.neuteredStatus.code,
        },
      });

      // ✅ ถ้ามีรูปใหม่
      if (payload.images && payload.images.length > 0) {
        // 1. ลบรูปเก่าออกก่อน
        await prisma.petRehomeImages.deleteMany({
          where: { post_id: id },
        });

        // 2. เพิ่มรูปใหม่ (เก็บเฉพาะ string URL)
        await prisma.petRehomeImages.createMany({
          data: payload.images.map((img: any) => ({
            post_id: id,
            image_url: typeof img === "string" ? img : img.url, // 👈 แก้ตรงนี้
          })),
        });
      }
    } else if (payload.type === "stray" || payload.type === "report") {
      post = await prisma.animalReports.update({
        where: { report_id: id },
        data: {
          description: payload.title,
          status: payload.status,
          animal_type: payload.pet_name,
          behavior: payload.gene,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid post type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("❌ Error updating post:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

