import { prisma } from "@/lib/prisma";
import { JSX } from "react";
import Header from "@/app/components/Header";
import Link from "next/link";
import { HiOutlineTag, HiOutlineCalendar } from "react-icons/hi";
import { BiUser } from "react-icons/bi";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";

interface DetailAnimalProps {
  params: Promise<{
    report_id: string;
  }>;
}

export default async function DetailAnimalPage(props: DetailAnimalProps) {
  // 1. Unwrapping params (Next.js 15)
  const params = await props.params;
  const reportId = parseInt(params.report_id, 10);

  // 2. ดึงข้อมูล (เพิ่ม include actions เพื่อดูประวัติการช่วย)
  const animal = await prisma.animalReports.findUnique({
    where: {
      report_id: reportId,
    },
    include: {
      images: true,
      user: true,
      actions: {
        include: {
          user: true,
        },
      },
    },
  });

  // 3. จัดการกรณีไม่พบข้อมูล
  if (!animal) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ไม่พบข้อมูล
            </h2>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-[#D4A373] text-white font-semibold rounded-lg hover:bg-[#B8956A]"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Logic คำนวณผู้ช่วยเหลือ (แปลงจาก HTML string เป็น JSX)
  const feedActions = animal.actions.filter((a) => a.action_type === "FEED");
  const adoptActions = animal.actions.filter((a) => a.action_type === "ADOPT");

  const feederNames = [
    ...new Set(feedActions.map((a) => a.user?.name || "ผู้ใจดี")),
  ].join(", ");
  const adopterNames = [
    ...new Set(adoptActions.map((a) => a.user?.name || "ผู้ใจดี")),
  ].join(", ");

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Breadcrumb & Header */}
        <div className="text-center mb-8">
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#D4A373] transition-colors"
                >
                  หน้าหลัก
                </Link>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-4 h-4 mx-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-medium text-gray-800">
                  {animal.animal_type}
                </span>
              </li>
            </ol>
          </nav>
          <div className="inline-block bg-[#D4A373] px-20 py-3 shadow-md">
            <h1 className="text-2xl font-semibold">รายละเอียดน้อง</h1>
          </div>
        </div>

        {/* ส่วนแสดงรูปภาพ */}
        <div className="mb-8 mx-auto">
          {animal.images.length > 0 ? (
            (() => {
              const count = animal.images.length;
              const imgs = animal.images.slice(0, 5); // จำกัด 5 รูป

              switch (count) {
                // 1️⃣ รูปเดียว
                case 1:
                  return (
                    <div className="flex justify-center">
                      <img
                        src={imgs[0].image_url}
                        alt="animal-1"
                        className="w-full max-w-2xl h-100 object-cover rounded-xl shadow-lg"
                      />
                    </div>
                  );

                // 2️⃣ สองรูป
                case 2:
                  return (
                    <div className="flex justify-center gap-4 flex-wrap">
                      {imgs.map((img, i) => (
                        <img
                          key={img.id}
                          src={img.image_url}
                          alt={`animal-${i}`}
                          className="w-full md:w-[calc(50%-1rem)] h-80 object-cover rounded-xl shadow-lg"
                        />
                      ))}
                    </div>
                  );

                // 3️⃣ สามรูป
                case 3:
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {imgs.map((img, i) => (
                        <img
                          key={img.id}
                          src={img.image_url}
                          alt={`animal-${i}`}
                          className="w-full h-64 object-cover rounded-xl shadow-lg"
                        />
                      ))}
                    </div>
                  );

                // 4️⃣ สี่รูป
                case 4:
                  return (
                    <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                      {imgs.map((img, i) => (
                        <div key={img.id} className="aspect-square w-full">
                          <img
                            src={img.image_url}
                            alt={`animal-${i}`}
                            className="w-full h-full object-cover rounded-xl shadow-md"
                          />
                        </div>
                      ))}
                    </div>
                  );

                // 5️⃣ ห้ารูปขึ้นไป (Layout ซ้ายใหญ่ ขวาเล็ก)
                default:
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 max-w-6xl mx-auto h-125">
                      {/* รูปใหญ่ซ้าย */}
                      <div className="rounded-2xl shadow-xl overflow-hidden h-full">
                        <img
                          src={imgs[0].image_url}
                          alt="Main"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* รูปขวาเล็ก 4 รูป */}
                      <div className="grid grid-rows-2 grid-cols-2 gap-3 h-full">
                        {imgs.slice(1, 5).map((img, i) => (
                          <div
                            key={img.id}
                            className="relative overflow-hidden rounded-xl shadow-lg"
                          >
                            <img
                              src={img.image_url}
                              alt={`sub-${i}`}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
              }
            })()
          ) : (
            <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center shadow-inner">
              <p className="text-gray-500">ไม่มีรูปภาพ</p>
            </div>
          )}
        </div>

        {/* --- ข้อมูลรายละเอียด (Layout เดิม + เพิ่มประวัติการช่วย) --- */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto border border-gray-100">
          {/* Header ข้อมูล */}
          <div className="flex justify-between items-start mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-[#D4A373] flex items-center gap-2">
              {animal.animal_type === "dog"
                ? "สุนัข"
                : animal.animal_type === "cat"
                ? "แมว"
                : animal.animal_type}
            </h2>
            <div className="text-right">
              <span className="block text-sm text-gray-500">วันที่พบ</span>
              <span className="text-gray-700 font-medium">
                {new Date(animal.created_at).toLocaleDateString("th-TH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* ลักษณะ */}
            <div className="flex items-start gap-3">
              <div className="mt-1 text-[#D4A373]">
                <HiOutlineTag size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800">ลักษณะ:</span>
                <p className="text-gray-600 mt-1">
                  {animal.description || "-"}
                </p>
              </div>
            </div>

            {/* พฤติกรรม */}
            <div className="flex items-start gap-3">
              <div className="mt-1 text-[#D4A373]">
                <MdOutlineQuestionAnswer size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800">
                  พฤติกรรม/อาการ:
                </span>
                <p className="text-gray-600 mt-1">
                  {animal.behavior === "friendly"
                    ? "เชื่อง เข้าหาคนได้"
                    : animal.behavior === "aggressive"
                    ? "ดุร้าย/หวาดกลัว"
                    : animal.behavior === "injured"
                    ? "บาดเจ็บ ต้องการความช่วยเหลือ"
                    : animal.behavior} 
                </p>
              </div>
            </div>

            {/* ที่อยู่ */}
            <div className="flex items-start gap-3">
              <div className="mt-1 text-red-500">
                <FiMapPin size={20} />
              </div>
              <div>
                <span className="font-semibold text-gray-800">สถานที่พบ:</span>
                <p className="text-gray-600 mt-1">{animal.location}</p>
              </div>
            </div>

            {/* ผู้โพสต์ */}
            <div className="flex items-center gap-3">
              <div className="text-gray-400">
                <BiUser size={20} />
              </div>
              <p className="text-gray-600">
                <span className="font-semibold">ผู้แจ้ง:</span>{" "}
                {animal.user?.name || "ไม่ระบุชื่อ"}
              </p>
            </div>
          </div>

          {/* --- ส่วนประวัติการช่วยเหลือ (เพิ่มเข้ามาให้เหมือน Map Popup) --- */}
          <div className="mt-8 bg-orange-50/50 rounded-xl p-5 border border-orange-100">
            <h3 className="font-bold text-gray-700 mb-3 border-b border-orange-200 pb-2">
              ประวัติการช่วยเหลือ
            </h3>
            <div className="space-y-2 text-sm md:text-base">
              {feedActions.length > 0 ? (
                <p className="text-[#6D4C41] flex items-start gap-2">
                  <span>🧡</span>
                  <span>
                    <strong>คนให้อาหารแล้ว:</strong> {feederNames}
                  </span>
                </p>
              ) : null}

              {adoptActions.length > 0 ? (
                <p className="text-[#4A5A2A] flex items-start gap-2">
                  <span>💚</span>
                  <span>
                    <strong>คนสนใจรับเลี้ยง:</strong> {adopterNames}
                  </span>
                </p>
              ) : null}

              {feedActions.length === 0 && adoptActions.length === 0 && (
                <p className="text-gray-400 italic text-center">
                  ยังไม่มีคนให้ความช่วยเหลือ...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
