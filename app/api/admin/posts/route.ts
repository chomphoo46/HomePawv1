import { NextResponse } from "next/server";
import {
  NeuteredStatus,
  PrismaClient,
  VaccinationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// ฟังก์ชันช่วย: จัดการ URL รูปภาพ
const mapImages = (
  images: { id: number; url?: string; image_url?: string }[],
) =>
  images.map((img) => {
    const raw = img.url ?? img.image_url ?? "";
    const normalized = raw.startsWith("http") ? raw : `${BASE_URL}/${raw}`;
    return { id: img.id, url: normalized };
  });

export async function GET() {
  try {
    // ดึงโพสต์หาบ้าน
    const petPosts = await prisma.petRehomePost.findMany({
      include: { images: true, user: true },
      orderBy: { created_at: "desc" },
    });

    // ดึงโพสต์แจ้งพบสัตว์
    const reportPosts = await prisma.animalReports.findMany({
      include: { images: true, user: true },
      orderBy: { created_at: "desc" },
    });

    // Normalize Data... (Pet เหมือนเดิม)
    const normalizedPetPosts = petPosts.map((p) => ({
      id: p.post_id,
      title: p.reason,
      phone: p.phone,
      pet_name: p.pet_name,
      type: "pet",
      gene: p.type,
      age: p.age,
      VaccinationStatus: p.vaccination_status as VaccinationStatus,
      sex: p.sex,
      address: p.address,
      contact: p.contact,
      NeuteredStatus: p.neutered_status as NeuteredStatus,
      status: p.status,
      user: p.user
        ? { id: p.user.user_id, name: p.user.name ?? p.user.name }
        : null,
      createdAt: p.created_at.toISOString(),
      images: mapImages(p.images),
    }));

    const normalizedReportPosts = reportPosts.map((r) => ({
      id: r.report_id,
      title: r.description,
      type: "report",
      status: r.status,
      location: r.location,
      behavior: r.behavior,
      animal_type: r.animal_type,
      user: r.user
        ? { id: r.user.user_id, name: r.user.name ?? r.user.name }
        : null,
      createdAt: r.created_at.toISOString(),
      images: mapImages(r.images),
    }));

    const allPosts = [...normalizedPetPosts, ...normalizedReportPosts];

    // เรียงลำดับรวมกันตามวันที่ (ล่าสุดขึ้นก่อน)
    allPosts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, type } = await req.json();

    if (!id || !type)
      return NextResponse.json(
        { error: "Missing id or type" },
        { status: 400 },
      );

    if (type === "pet") {
      // --- ลบโพสต์หาบ้าน ---

      // 1. ลบรูปภาพก่อน
      await prisma.petRehomeImages.deleteMany({
        where: { post_id: id },
      });

      // 2.ลบคำขอรับเลี้ยง

      await prisma.adoptionRequest.deleteMany({
        where: { post_id: id },
      });

      // 3. สุดท้ายค่อยลบตัวโพสต์
      await prisma.petRehomePost.delete({
        where: { post_id: id },
      });
    } else if (type === "report") {
      await prisma.animalImage.deleteMany({
        where: { report_id: id },
      });

      await prisma.helpAction.deleteMany({
        where: { report_id: id },
      });

      await prisma.animalReports.delete({
        where: { report_id: id },
      });
    }

    return NextResponse.json({ success: true, message: "ลบสำเร็จ" });
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post", details: String(error) },
      { status: 500 },
    );
  }
}
