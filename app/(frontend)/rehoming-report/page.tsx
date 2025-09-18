"use client";

import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { useState, useEffect, JSX } from "react";
import { FaMars, FaVenus, FaGenderless, FaTimesCircle } from "react-icons/fa";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { FiMapPin } from "react-icons/fi";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FaSearch } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import Link from "next/link";
import { Mali } from "next/font/google";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

export default function RehomingReportPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    breed: "",
    sex: "",
    age: "",
    location: "",
    vaccinated: "",
  });
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

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
      icon: <FaCircleCheck size={22} style={{ color: "green" }} />,
    },
    NOT_VACCINATED: {
      label: "ยังไม่ได้ฉีดวัคซีน",
      icon: <FaTimesCircle size={22} style={{ color: "red" }} />,
    },
  };
  // Mapping สถานะการทำหมัน
  const neuteredstatusIcons: Record<
    string,
    { label: string; icon: JSX.Element }
  > = {
    NEUTERED: {
      label: "ทำหมันแล้ว",
      icon: <FaCircleCheck size={22} style={{ color: "green" }} />,
    },
    NOT_NEUTERED: {
      label: "ยังไม่ได้ทำหมัน",
      icon: <FaTimesCircle size={22} style={{ color: "red" }} />,
    },
  };
  // Filter posts ตาม filters
  const filteredPosts = posts.filter((post) => {
    if (
      filters.breed &&
      !post.type.toLowerCase().includes(filters.breed.toLowerCase())
    )
      return false;
    if (filters.sex && filters.sex !== "All") {
      if (filters.sex === "male" && post.sex !== "MALE") return false;
      if (filters.sex === "female" && post.sex !== "FEMALE") return false;
    }
    if (filters.age && filters.age !== "All") {
      const ageNumber = parseInt(post.age, 10);
      switch (filters.age) {
        case "0-1year":
          if (ageNumber < 0 || ageNumber > 1) return false;
          break;
        case "1-5year":
          if (ageNumber < 1 || ageNumber > 5) return false;
          break;
        case "5-10year":
          if (ageNumber < 5 || ageNumber > 10) return false;
          break;
        case "10year up":
          if (ageNumber < 10) return false;
          break;
      }
    }
    if (filters.vaccinated) {
      if (
        filters.vaccinated === "vaccinated" &&
        post.vaccination_status !== "VACCINATED"
      )
        return false;
      if (
        filters.vaccinated === "unvaccinated" &&
        post.vaccination_status !== "NOT_VACCINATED"
      )
        return false;
    }
    // กรองตามสถานที่
    if (
      filters.location &&
      !post.address.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;

    return true;
  });

  //เรียงตามวันที่สร้าง
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className={`min-h-screen bg-white ${mali.className}`}>
      <Header />
      <div className="flex flex-1 flex-col items-center justify-start w-full">
        {/* Banner */}
        <div className="w-full h-auto shadow-lg p-6 md:p-12 mb-8 flex flex-col items-center text-center bg-gradient-to-br from-[#FEFAE0] via-white to-[#F4F3EE]">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-800 leading-tight">
              "หนึ่งการรับเลี้ยง เปลี่ยนหนึ่งชีวิต"
            </h1>

            {/* CTA Button - ทำให้เด่นขึ้น */}
            <div className="relative">
              <button
                className="group relative overflow-hidden bg-gradient-to-r from-[#D4A373] to-[#E76F51] hover:from-[#E76F51] hover:to-[#D4A373] 
                   text-lg md:text-2xl text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-bold 
                   shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 
                   cursor-pointer animate-pulse hover:animate-none border-2 border-white"
                onClick={() => router.push("/form-rehoming")}
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                        translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                <span className="relative z-10 flex items-center gap-3">
                  <span>🏠 หาบ้านให้สัตว์เลี้ยงของคุณ</span>
                  <svg className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>

              {/* Decorative Elements */}
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#E9C46A] rounded-full animate-ping opacity-75"></div>
              <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-[#F4A261] rounded-full animate-ping opacity-75 delay-300"></div>
            </div>

            <p className="text-sm md:text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              ช่วยให้น้องหาบ้านใหม่ที่อบอุ่นและเต็มไปด้วยความรัก
            </p>
          </div>

          {/* Divider */}
          <div className="w-full max-w-4xl mx-auto mb-8">
            <div className="flex items-center">
              <div className="flex-1 border-t-2 border-[#D4A373] opacity-30"></div>
              <span className="px-4 text-[#D4A373] font-semibold">ค้นหาสัตว์เลี้ยง</span>
              <div className="flex-1 border-t-2 border-[#D4A373] opacity-30"></div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 w-full justify-center max-w-6xl mx-auto">
            <div className="flex flex-col group">
              <span className="mb-2 text-left pl-1 text-sm md:text-base font-medium text-gray-700">สายพันธุ์</span>
              <input
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-40 md:w-48 outline-none 
                   focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300
                   group-hover:border-gray-300 bg-white shadow-sm"
                placeholder="ระบุสายพันธุ์..."
                value={filters.breed}
                onChange={(e) =>
                  setFilters({ ...filters, breed: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col group">
              <span className="mb-2 text-left pl-1 text-sm md:text-base font-medium text-gray-700">เพศ</span>
              <select
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-40 md:w-48 outline-none 
                   focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300
                   group-hover:border-gray-300 bg-white shadow-sm cursor-pointer"
                value={filters.sex}
                onChange={(e) =>
                  setFilters({ ...filters, sex: e.target.value })
                }
              >
                <option value="All">ทั้งหมด</option>
                <option value="female">เพศเมีย</option>
                <option value="male">เพศผู้</option>
              </select>
            </div>

            <div className="flex flex-col group">
              <span className="mb-2 text-left pl-1 text-sm md:text-base font-medium text-gray-700">อายุ</span>
              <select
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-40 md:w-48 outline-none 
                   focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300
                   group-hover:border-gray-300 bg-white shadow-sm cursor-pointer"
                value={filters.age}
                onChange={(e) =>
                  setFilters({ ...filters, age: e.target.value })
                }
              >
                <option value="All">ทั้งหมด</option>
                <option value="0-1year">อายุ 0-1 ปี</option>
                <option value="1-5year">อายุ 1-5 ปี</option>
                <option value="5-10year">อายุ 5-10 ปี</option>
                <option value="10year up">อายุ 10 ปีขึ้นไป</option>
              </select>
            </div>

            <div className="flex flex-col group">
              <span className="mb-2 text-left pl-1 text-sm md:text-base font-medium text-gray-700">สถานที่</span>
              <input
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-40 md:w-48 outline-none 
                   focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300
                   group-hover:border-gray-300 bg-white shadow-sm"
                placeholder="จังหวัด/เขต..."
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col group">
              <span className="mb-2 text-left pl-1 text-sm md:text-base font-medium text-gray-700">วัคซีน</span>
              <select
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-40 md:w-48 outline-none 
                   focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300
                   group-hover:border-gray-300 bg-white shadow-sm cursor-pointer"
                value={filters.vaccinated}
                onChange={(e) =>
                  setFilters({ ...filters, vaccinated: e.target.value })
                }
              >
                <option value="">ทั้งหมด</option>
                <option value="vaccinated">ฉีดวัคซีนแล้ว</option>
                <option value="unvaccinated">ยังไม่ได้ฉีด</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                className="border-2 border-[#D4A373] rounded-xl cursor-pointer bg-[#D4A373] hover:bg-[#E76F51] 
                   text-white w-20 md:w-20 h-[52px] flex items-center justify-center
                   shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300
                   group"
              >
                <FaSearch className="text-lg group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Results header */}
        <div className="w-full max-w-6xl flex justify-between items-center px-4 mb-4">
          <span className="text-black text-sm">
            กำลังแสดง {sortedPosts.length} รายการ
          </span>
          <select
            className="border rounded px-2 py-1 text-sm bg-[#FEFAE0]"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "newest" | "oldest")
            }
          >
            <option value={"newest"}>เรียงตาม: ใหม่ล่าสุด</option>
            <option value={"oldest"}>เรียงตาม: เก่าที่สุด</option>
          </select>
        </div>

        {/* Pet cards grid */}
        <div className="px-4 md:px-8 lg:px-12 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {sortedPosts.map((post: any) => (
              <div
                key={post.post_id}
                className="relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-white group border border-gray-100 flex flex-col"
              >
                <Link
                  key={post.post_id}
                  href={`/rehoming-report/${post.post_id}`}
                  className="flex flex-col h-full"
                >
                  {/* Image */}
                  {post.images?.length > 0 ? (
                    <img
                      src={post.images[0].image_url}
                      alt={post.pet_name}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      ไม่มีรูปภาพ
                    </div>
                  )}

                  {/* Content - ปรับให้ grow เพื่อดันส่วน footer ลงล่าง */}
                  <div className="p-4 text-sm md:text-base text-gray-700 space-y-2 flex-grow">
                    <h3 className="text-xl font-semibold text-[#D4A373] truncate mb-3">
                      {post.pet_name}
                    </h3>

                    <p className="flex items-center gap-2">
                      <HiOutlineTag className="text-[#D4A373] flex-shrink-0" />{" "}
                      <span className="truncate">{post.type || "ไม่ระบุ"}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      {post.sex === "MALE" ? (
                        <FaMars className="text-blue-500 flex-shrink-0" />
                      ) : post.sex === "FEMALE" ? (
                        <FaVenus className="text-pink-500 flex-shrink-0" />
                      ) : (
                        <FaGenderless className="text-gray-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{getSexLabel(post.sex)}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <HiOutlineCalendar className="text-[#D4A373] flex-shrink-0" />
                      <span className="truncate">อายุ: {post.age || "ไม่ระบุ"}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <MdOutlineQuestionAnswer className="text-[#D4A373] flex-shrink-0" />
                      <span className="truncate">เหตุผล: {post.reason || "ไม่ระบุ"}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <HiOutlinePhone className="text-[#D4A373] flex-shrink-0" />
                      <span className="truncate">{post.phone || "ไม่ระบุ"}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <FiMapPin className="text-red-500 flex-shrink-0" />
                      <span className="truncate">{post.address || "ไม่ระบุ"}</span>
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 pt-2 mt-auto">
                    <div className="flex items-center justify-between gap-4 text-xs md:text-sm pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <span className="flex-shrink-0">
                          {healthStatusIcons[post.vaccination_status]?.icon}
                        </span>
                        <span className="truncate">
                          {healthStatusIcons[post.vaccination_status]?.label || "ไม่ระบุ"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <span className="flex-shrink-0">
                          {neuteredstatusIcons[post.neutered_status]?.icon}
                        </span>
                        <span className="truncate">
                          {neuteredstatusIcons[post.neutered_status]?.label || "ไม่ระบุ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
