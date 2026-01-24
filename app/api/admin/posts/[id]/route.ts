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

// ฟังก์ชันช่วย: จัดการ URL รูปภาพ
const mapImages = (
  images: { id: number; url?: string; image_url?: string }[]
) =>
  images.map((img) => {
    const raw = img.url ?? img.image_url ?? "";
    const normalized = raw.startsWith("http") ? raw : `${BASE_URL}/${raw}`;
    return { id: img.id, url: normalized };
  });

// 📍 GET /api/admin/posts/[id]
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    // --- กรณีโพสต์หาบ้าน (Pet) ---
    if (type === "pet") {
      const post = await prisma.petRehomePost.findUnique({
        where: { post_id: Number(id) },
        include: {
          user: { select: { name: true, email: true } },
          images: true,
        },
      });

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      const formatted = {
        id: post.post_id,
        type: "pet",
        pet_name: post.pet_name,
        title: post.reason,
        address: post.address,
        phone: post.phone,
        contact: post.contact,
        gene: post.type,
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

    // --- กรณีแจ้งพบสัตว์ (Report/Stray) ---
    // ✅ แก้ไข: เพิ่มเงื่อนไข || type === "report" เพื่อรองรับ URL ที่ส่งมา
    if (type === "stray" || type === "report") {
      const post = await prisma.animalReports.findUnique({
        where: { report_id: Number(id) },
        include: {
          user: { select: { name: true, email: true } },
          images: true,
        },
      });

      if (!post) {
        return Response.json({ error: "Report not found" }, { status: 404 });
      }

      // ✅ Map ข้อมูลให้ตรงกับฟอร์มหน้าบ้าน
      // หน้าบ้านใช้ key: title, pet_name, gene เพื่อแสดงผล เราต้อง map field จาก DB ให้ตรง
      const formatted = {
        id: post.report_id,
        type: "report", // ส่งกลับเป็น report ให้ตรงกัน
        title: post.description, // description -> title
        pet_name: post.animal_type, // animal_type -> pet_name
        gene: post.behavior, // behavior -> gene
        address: post.location || `${post.latitude}, ${post.longitude}`,
        phone: "-",
        contact: "-",
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

// 📍 PATCH: แก้ไขโพสต์
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

    // --- แก้ไขโพสต์หาบ้าน (Pet) ---
    if (payload.type === "pet") {
      if (payload.images && payload.images.length > 5) {
        return NextResponse.json(
          { error: "You can upload up to 5 images only" },
          { status: 400 }
        );
      }

      // ข้อมูลที่จะใช้ update (แยกออกมาเพื่อไม่ให้โค้ดซ้ำซ้อน)
      const updateData = {
        reason: payload.title,
        status: payload.status,
        contact: payload.contact,
        phone: payload.phone,
        address: payload.address,
        pet_name: payload.pet_name,
        type: payload.gene,
        sex: payload.sex,
        age: payload.age,
        vaccination_status: payload.vaccinationStatus?.code || "UNKNOWN",
        neutered_status: payload.neuteredStatus?.code || "UNKNOWN",
      };

      // ✅ 1. เช็คว่ามีการเปลี่ยนสถานะเป็น "ADOPTED" หรือไม่?
      if (payload.status === "ADOPTED") {
        // ใช้ Transaction: แก้ไขโพสต์ และ ปิดคำขอที่ค้างอยู่ พร้อมกัน
        const [updatedPost] = await prisma.$transaction([
          // 1.1 อัปเดตโพสต์
          prisma.petRehomePost.update({
            where: { post_id: id },
            data: updateData,
          }),
          // 1.2 อัปเดตคำขอที่ยัง PENDING ให้เป็น REJECTED
          prisma.adoptionRequest.updateMany({
            where: {
              post_id: id,
              status: "PENDING",
            },
            data: {
              status: "REJECTED", // หรือเปลี่ยนเป็นสถานะอื่นที่สื่อว่า "ไม่ได้ไปต่อ"
            },
          }),
        ]);
        post = updatedPost;
      } else {
        // ✅ 2. ถ้าไม่ใช่ ADOPTED ก็อัปเดตแค่โพสต์ตามปกติ
        post = await prisma.petRehomePost.update({
          where: { post_id: id },
          data: updateData,
        });
      }

      // อัปเดตรูปภาพ Pet (คงเดิม)
      if (payload.images && payload.images.length > 0) {
        await prisma.petRehomeImages.deleteMany({ where: { post_id: id } });
        await prisma.petRehomeImages.createMany({
          data: payload.images.map((img: any) => ({
            post_id: id,
            image_url: typeof img === "string" ? img : img.url,
          })),
        });
      }
    }

    // --- แก้ไขโพสต์แจ้งพบสัตว์ (Report/Stray) ---
    else if (payload.type === "stray" || payload.type === "report") {
      // 1. อัปเดตข้อมูล Text
      post = await prisma.animalReports.update({
        where: { report_id: id },
        data: {
          description: payload.title,
          status: payload.status,
          animal_type: payload.pet_name,
          behavior: payload.gene,
          location: payload.address
        },
      });

      // 2. Logic อัปเดตรูปภาพสำหรับ Report
      if (payload.images && payload.images.length > 0) {
        await prisma.animalImage.deleteMany({
          where: { report_id: id },
        });

        await prisma.animalImage.createMany({
          data: payload.images.map((img: any) => ({
            report_id: id,
            image_url: typeof img === "string" ? img : img.url,
          })),
        });
      }
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
