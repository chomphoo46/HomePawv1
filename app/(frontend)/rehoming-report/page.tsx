"use client";

import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { useState, useEffect, JSX } from "react";
import {
  FaMars,
  FaVenus,
  FaGenderless,
  FaSyringe,
  FaTimesCircle,
} from "react-icons/fa";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FaSearch } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { Mali } from "next/font/google";
const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

export default function RehomingReportPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({
    breed: "",
    sex: "",
    age: "",
    location: "",
    vaccinated: "",
  });

  // โหลดข้อมูลตอน mount
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/rehoming-report", { cache: "no-store" });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchPosts();
  }, []);
  // แปลงเพศเป็นภาษาไทย
  const getSexLabel = (sex: string) => {
    switch (sex) {
      case "MALE":
        return "เพศ: ผู้";
      case "FEMALE":
        return "เพศ: เมีย";
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
      icon: <FaCircleCheck className="text-green-600" />,
    },
    NOT_VACCINATED: {
      label: "ยังไม่ได้ฉีดวัคซีน",
      icon: <FaTimesCircle className="text-red-600" />,
    },
  };
  return (
    <div className={`min-h-screen bg-white flex flex-col ${mali.className}`}>
      <Header />
      <div className="flex flex-1 flex-col items-center justify-start">
        {/* Banner */}
        <div className="w-full h-80 shadow p-8 mb-8 flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-10">
            “หนึ่งการรับเลี้ยง เปลี่ยนหนึ่งชีวิต”
          </h1>
          <button
            className="bg-[#D4A373] hover:bg-[#d4a373cd] text-lg text-white px-8 py-2 rounded-3xl font-semibold mb-10 mt-10 cursor-pointer"
            onClick={() => router.push("/form-rehoming")}
          >
            หาบ้านให้สัตว์เลี้ยงของคุณ คลิกที่นี่
          </button>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 w-full justify-center mb-8 mt-8">
            <label className="text-gray-700 p-2">ค้นหาสัตว์เลี้ยง:</label>
            <input
              className="border rounded-lg px-3 py-2 w-48 outline-none focus:border-2 focus:border-[#D4A373]"
              placeholder="สายพันธุ์"
              value={filters.breed}
              onChange={(e) =>
                setFilters({ ...filters, breed: e.target.value })
              }
            />
            <select
              className="border rounded-lg px-3 py-2 w-48 outline-none focus:border-2 focus:border-[#D4A373]"
              value={filters.sex}
              onChange={(e) => setFilters({ ...filters, sex: e.target.value })}
            >
              <option value="All">ทั้งหมด</option>
              <option value="female">เพศเมีย</option>
              <option value="male">เพศผู้</option>
            </select>
            <select
              className="border rounded-lg px-3 py-2 w-48 outline-none focus:border-2 focus:border-[#D4A373]"
              value={filters.age}
              onChange={(e) => setFilters({ ...filters, age: e.target.value })}
            >
              <option value="All">ทั้งหมด</option>
              <option value="0-1year">อายุ 0-1 ปี</option>
              <option value="1-5year">อายุ 1-5 ปี</option>
              <option value="5-10year">อายุ 5-10 ปี</option>
              <option value="10year up">อายุ 10 ปีขึ้นไป</option>
            </select>
            <input
              className="border rounded-lg px-3 py-2 w-48 outline-none focus:border-2 focus:border-[#D4A373]"
              placeholder="สถานที่"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            />
            <select
              className="border rounded-lg px-3 py-2 w-48 outline-none focus:border-2 focus:border-[#D4A373]"
              value={filters.vaccinated}
              onChange={(e) =>
                setFilters({ ...filters, vaccinated: e.target.value })
              }
            >
              <option value="">ทั้งหมด</option>
              <option value="vaccinated">ฉีดวัคซีนแล้ว</option>
              <option value="unvaccinated">ยังไม่ได้ฉีด</option>
            </select>
            <button className="border px-4 py-2 rounded-lg cursor-pointer hover:bg-[#FAEDCD]">
              <FaSearch />
            </button>
          </div>
        </div>

        {/* Results header */}
        <div className="w-full max-w-6xl flex justify-between items-center mb-4">
          <span className="text-black text-sm">
            กำลังแสดง {posts.length} รายการ
          </span>
          <select className="border rounded px-2 py-1 text-sm">
            <option>เรียงตาม: ใหม่ล่าสุด</option>
            <option>เรียงตาม: เก่าที่สุด</option>
          </select>
        </div>

        {/* Pet cards grid */}
        <div className="px-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {posts.map((post: any) => (
              <div
                key={post.post_id}
                className="rounded-2xl p-4 shadow hover:shadow-lg transition "
              >
                {post.images?.length > 0 && (
                  <img
                    src={post.images[0].image_url}
                    alt={post.pet_name}
                    className="w-full h-75 object-cover mb-2 "
                  />
                )}
                <h2 className="font-bold text-2xl text-[#D4A373]">
                  {post.pet_name}
                </h2>
                <p className="flex items-center gap-2">
                  <HiOutlineTag />
                  พันธุ์: {post.type}
                </p>
                <p className="flex items-center gap-2">
                  {post.sex === "MALE" ? (
                    <FaMars />
                  ) : post.sex === "FEMALE" ? (
                    <FaVenus />
                  ) : (
                    <FaGenderless />
                  )}
                  {getSexLabel(post.sex)}
                </p>
                <p className="flex items-center gap-2">
                  <HiOutlineCalendar />
                  อายุ: {post.age}
                </p>
                <p className="flex items-center gap-2">
                  <MdOutlineQuestionAnswer />
                  เหตุผลที่หาบ้านใหม่: {post.reason}
                </p>
                <p className="flex items-center gap-2">
                  <HiOutlinePhone />
                  ติดต่อ: {post.phone}
                </p>
                <p className="flex items-center gap-2">
                  {healthStatusIcons[post.health_status]?.icon}
                  สุขภาพ:{" "}
                  {healthStatusIcons[post.health_status]?.label || "ไม่ระบุ"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
