import { prisma } from "@/lib/prisma";
import Header from "@/app/components/Header";
import Link from "next/link";

interface DetailAnimalProps {
  params: {
    post_id: string;
  };
}

export default async function DetailAnimalPage( props : DetailAnimalProps) {
  const params = await props.params;
  const postId = parseInt(params.post_id, 10);

  // ดึงข้อมูลสัตว์เลี้ยงพร้อม relation images
  const animal = await prisma.petRehomePost.findUnique({
    where: { post_id: postId },
    include: { images: true, user: true }, // ดึง user ด้วยถ้าต้องการ
  });

  if (!animal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Header />
        <p className="text-center text-red-600 text-xl mt-10">
          ไม่พบข้อมูลสัตว์เลี้ยง
        </p>
        <Link href="/rehoming-report" className="mt-4 text-blue-600 underline">
          กลับไปหน้ารายการสัตว์
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="max-w-3xl mx-auto py-10 px-4">
        {/* ชื่อสัตว์เลี้ยง */}
        <h1 className="text-3xl font-bold mb-6 text-center">{animal.pet_name}</h1>

        {/* รูปภาพ */}
        {animal.images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {animal.images.map((img) => (
              <img
                key={img.id}
                src={img.image_url} // สมมติ field ของรูปชื่อ url
                alt={`${animal.pet_name}-${img.id}`}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-6">ไม่มีรูปภาพ</p>
        )}

        {/* ข้อมูลสัตว์ */}
        <div className="bg-orange-50 p-6 rounded-xl shadow-md space-y-3">
          <p>
            <span className="font-semibold">สายพันธุ์/ประเภท:</span> {animal.type}
          </p>
          <p>
            <span className="font-semibold">เพศ:</span> {animal.sex === "MALE" ? "ผู้" : "เมีย"}
          </p>
          <p>
            <span className="font-semibold">อายุ:</span> {animal.age}
          </p>
          <p>
            <span className="font-semibold">สถานะสุขภาพ:</span>{" "}
            {animal.health_status === "VACCINATED" ? "ฉีดวัคซีนแล้ว" : "ยังไม่ได้ฉีดวัคซีน"}
          </p>
          <p>
            <span className="font-semibold">เหตุผลที่หาบ้านใหม่:</span> {animal.reason}
          </p>
          <p>
            <span className="font-semibold">เบอร์ติดต่อ:</span> {animal.phone}
          </p>
          <p>
            <span className="font-semibold">สถานะประกาศ:</span> {animal.status}
          </p>
          <p>
            <span className="font-semibold">วันที่แจ้ง:</span> {new Date(animal.created_at).toLocaleString("th-TH")}
          </p>
        </div>

        {/* ปุ่มกลับ */}
        <div className="mt-6 text-center">
          <Link
            href="/rehoming-report"
            className="inline-block bg-[#D4A373] hover:bg-[#b98b5e] text-white font-semibold py-2 px-6 rounded"
          >
            กลับไปหน้ารายการสัตว์
          </Link>
        </div>
      </div>
    </div>
  );
}
