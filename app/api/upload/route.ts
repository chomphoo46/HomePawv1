import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // อัปโหลดไปยัง Vercel Blob แทนการเขียนลง Disk
    const blob = await put(file.name, file, {
      access: "public",
    });

    // ส่ง URL ที่ได้จาก Blob กลับไป (หน้าตาจะเป็น https://xxxx.public.blob.vercel-storage.com/...)
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}