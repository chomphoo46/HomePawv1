import { prisma } from "@/lib/prisma";
import { JSX } from "react";

import Header from "@/app/components/Header";
import Link from "next/link";
import { FaMars, FaVenus, FaGenderless, FaTimesCircle } from "react-icons/fa";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { RiContactsBook3Line } from "react-icons/ri";
import { BiUser } from "react-icons/bi";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import { FaCircleCheck } from "react-icons/fa6";

interface DetailAnimalProps {
  params: {
    post_id: string;
  };
}

export default async function DetailAnimalPage(props: DetailAnimalProps) {
  const params = await props.params;
  const postId = parseInt(params.post_id, 10);

  // ดึงข้อมูลสัตว์เลี้ยงพร้อม relation images
  const animal = await prisma.petRehomePost.findUnique({
    where: {
      post_id: Number(params.post_id),
    },
    include: {
      images: true,
      user: true,
    },
  });

  // แปลงเพศเป็นภาษาไทย
  const getSexLabel = (sex: string) => {
    switch (sex) {
      case "MALE":
        return "ผู้";
      case "FEMALE":
        return "เมีย";
      default:
        return "ไม่ระบุ";
    }
  };

  // Mapping สถานะสุขภาพ
  const healthStatusIcons: Record<
    string,
    { label: string; icon: JSX.Element }
  > = {
    VACCINATED: {
      label: "ฉีดวัคซีนแล้ว",
      icon: <FaCircleCheck size={24} style={{ color: "green" }} />,
    },
    NOT_VACCINATED: {
      label: "ยังไม่ได้ฉีดวัคซีน",
      icon: <FaTimesCircle size={24} style={{ color: "red" }} />,
    },
  };

  // Mapping สถานะการทำหมัน
  const neuteredstatusIcons: Record<
    string,
    { label: string; icon: JSX.Element }
  > = {
    NEUTERED: {
      label: "ทำหมันแล้ว",
      icon: <FaCircleCheck size={24} style={{ color: "green" }} />,
    },
    NOT_NEUTERED: {
      label: "ยังไม่ได้ทำหมัน",
      icon: <FaTimesCircle size={24} style={{ color: "red" }} />,
    },
  };

  if (!animal) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              ไม่พบข้อมูลสัตว์เลี้ยง
            </h2>
            <p className="text-gray-600 mb-6">
              ขออภัย ไม่พบข้อมูลสัตว์เลี้ยงที่คุณค้นหา
            </p>
            <Link
              href="/rehoming-report"
              className="inline-flex items-center px-6 py-3 bg-[#D4A373] text-white font-semibold rounded-lg hover:bg-[#B8956A] transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              กลับไปหน้ารายการสัตว์
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* หัวข้อหลัก */}
        <div className="text-center mb-8">
          {/* Breadcrumb */}
          <nav className="mb-6 ">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/rehoming-report"
                  className="hover:text-[#D4A373] transition-colors"
                >
                  รายการสัตว์เลี้ยง
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
                  {animal.pet_name}
                </span>
              </li>
            </ol>
          </nav>
          <div className="inline-block bg-[#D4A373] px-20 py-3 shadow-md">
            <h1 className="text-2xl font-semibold">น้องหาบ้าน</h1>
          </div>
        </div>

        <div className="mb-8 max-w-5xl mx-auto">
          {animal.images.length > 0 ? (
            (() => {
              const count = animal.images.length;
              const imgs = animal.images.slice(0, 5); // จำกัด 5 รูป

              switch (count) {
                // 1️⃣ รูปเดียว → กลางจอ, ขนาดพอดี
                case 1:
                  return (
                    <div className="flex justify-center">
                      <img
                        src={imgs[0].image_url}
                        alt={`${animal.pet_name}-1`}
                        className="w-80 max-w-md object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                      />
                    </div>
                  );

                // 2️⃣ สองรูป → ขนาดเท่ากันตรงกลาง
                case 2:
                  return (
                    <div className="flex justify-center gap-4 flex-wrap">
                      {imgs.map((img, i) => (
                        <img
                          key={img.id}
                          src={img.image_url}
                          alt={`${animal.pet_name}-${i + 1}`}
                          className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                        />
                      ))}
                    </div>
                  );

                // 3️⃣ สามรูป → ขนาดเท่ากันเรียงกลาง
                case 3:
                  return (
                    <div className="flex justify-center gap-4 flex-wrap">
                      {imgs.map((img, i) => (
                        <img
                          key={img.id}
                          src={img.image_url}
                          alt={`${animal.pet_name}-${i + 1}`}
                          className="w-50 h-50 md:w-64 md:h-64 object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                        />
                      ))}
                    </div>
                  );

                // 4️⃣ สี่รูป → 2 บน 2 ล่าง
                case 4:
                  return (
                    <div className="max-w-[500px] mx-auto grid grid-cols-2 gap-2">
                      {imgs.map((img, i) => (
                        <div key={img.id} className="aspect-square w-full">
                          <img
                            src={img.image_url}
                            alt={`${animal.pet_name}-${i + 1}`}
                            className="w-full h-full object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  );

                // 5️⃣ ห้ารูป → ซ้ายใหญ่ ขวาเล็ก 4 รูป
                default:
                  return (
                    <div className="grid grid-cols-[3fr_2fr] gap-3 max-w-6xl mx-auto">
                      {/* รูปใหญ่ซ้าย */}
                      <div className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ">
                        <img
                          src={imgs[0].image_url}
                          alt={`${animal.pet_name}-1`}
                          className="w-full h-full object-cover aspect-4/3  transition-transform duration-500"
                        />
                      </div>

                      {/* รูปขวาเล็ก 4 รูป */}
                      <div className="grid grid-rows-2 grid-cols-2 gap-3">
                        {imgs.slice(1, 5).map((img, i) => (
                          <div
                            key={img.id}
                            className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300  aspect-square"
                          >
                            <img
                              src={img.image_url}
                              alt={`${animal.pet_name}-${i + 2}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
              }
            })()
          ) : (
            <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center shadow-inner">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500">ไม่มีรูปภาพ</p>
              </div>
            </div>
          )}
        </div>

        {/* ข้อมูลสัตว์ */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          {/* ชื่อและวันที่ */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-semibold  text-[#D4A373]">
              {animal.pet_name}
            </h2>
            <span className="text-sm text-gray-600">
              {new Date(animal.created_at).toLocaleDateString("th-TH", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              {new Date(animal.created_at).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* ข้อมูลรายละเอียด */}
          <div className="space-y-4">
            {/* ที่อยู่ */}
            <div className="flex items-start">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base">
                <FiMapPin />
              </div>
              <div>
                <p className="text-gray-800">
                  <span className="font-semibold">ที่อยู่:</span>{" "}
                  {animal.address}
                </p>
              </div>
            </div>

            {/* สายพันธุ์ */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base">
                <HiOutlineTag />
              </div>
              <p className="text-gray-800">
                <span className="font-semibold">สายพันธุ์:</span> {animal.type}
              </p>
            </div>

            {/* เพศ */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base ">
                {animal.sex === "MALE" ? (
                  <FaMars />
                ) : animal.sex === "FEMALE" ? (
                  <FaVenus />
                ) : (
                  <FaGenderless />
                )}
              </div>
              <p className="text-gray-800">
                <span className="font-semibold">เพศ:</span>{" "}
                {getSexLabel(animal.sex)}
              </p>
            </div>

            {/* อายุ */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base">
                <HiOutlineCalendar />
              </div>
              <p className="text-gray-800">
                <span className="font-semibold">อายุ:</span> {animal.age}
              </p>
            </div>

            {/* เหตุผลในการหาบ้าน */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base">
                <MdOutlineQuestionAnswer />
              </div>
              <p className="text-gray-800">
                <span className="font-semibold">เหตุผลในการหาบ้าน:</span>{" "}
                {animal.reason}
              </p>
            </div>

            {/* เบอร์โทร */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base">
                <HiOutlinePhone />
              </div>
              <p className="text-gray-800">
                <span className="font-semibold">Tel:</span> {animal.phone}
              </p>
            </div>

            {/* เบอร์โทร */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base">
                <RiContactsBook3Line />
              </div>
              <p className="text-gray-800">
                <span className="font-semibold">ช่องทางติดต่ออื่นๆ:</span>{" "}
                {animal.contact || "-"}
              </p>
            </div>

            {/* ผู้โพสต์ */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-2 text-sm md:text-base">
                <BiUser />
              </div>
              <p className="text-gray-800">
                <span className="font-semibold">ผู้โพสต์:</span>{" "}
                {animal.user?.name || "ไม่พบชื่อผู้โพสต์"}
              </p>
            </div>
          </div>

          {/* สถานะสุขภาพ */}
          <div className="flex gap-4 mt-8">
            <div className="flex items-center">
              <p className="flex items-center gap-2 text-sm md:text-base">
                {healthStatusIcons[animal.vaccination_status]?.icon}
                {healthStatusIcons[animal.vaccination_status]?.label ||
                  "ไม่ระบุ"}
              </p>
            </div>
            <div className="flex items-center">
              <p className="flex items-center gap-2 text-sm md:text-base">
                {neuteredstatusIcons[animal.neutered_status]?.icon}
                {neuteredstatusIcons[animal.neutered_status]?.label ||
                  "ไม่ระบุ"}
              </p>
            </div>
          </div>
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="flex gap-4 justify-center mt-8 max-w-md mx-auto">
          <button className="flex-1 bg-[#D4A373] hover:bg-[#B8956A] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
            สนใจรับเลี้ยง
          </button>
          <button className="flex-1 bg-[#E8DCC0] hover:bg-[#DDD0B0] text-gray-800 font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
            ติดต่อ
          </button>
        </div>
      </div>
    </div>
  );
}
