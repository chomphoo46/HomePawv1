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
        <div className="w-full h-auto shadow p-6 md:p-8 mb-8 flex flex-col items-center text-center">
          <h1 className="text-xl md:text-3xl font-bold mb-18">
            “หนึ่งการรับเลี้ยง เปลี่ยนหนึ่งชีวิต”
          </h1>
          <button
            className="animate-bounce bg-[#D4A373] hover:bg-[#d4a373cd] text-base md:text-xl text-white px-6 md:px-8 py-2 rounded-3xl font-semibold mb-18 cursor-pointer"
            onClick={() => router.push("/form-rehoming")}
          >
            หาบ้านให้สัตว์เลี้ยงของคุณ คลิกที่นี่
          </button>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 w-full justify-center">
            <div className="flex flex-col">
              <span className="mb-1 text-left pl-1">สายพันธุ์</span>
              <input
                className="border rounded-lg px-3 py-2 w-40 md:w-48 outline-none focus:border-2 focus:border-[#D4A373]"
                value={filters.breed}
                onChange={(e) =>
                  setFilters({ ...filters, breed: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <span className="mb-1 text-left pl-1">เพศ</span>
              <select
                className="border rounded-lg px-3 py-2 w-40 md:w-48 outline-none focus:border-2 focus:border-[#D4A373]"
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

            <div className="flex flex-col">
              <span className="mb-1 text-left pl-1">อายุ</span>
              <select
                className="border rounded-lg px-3 py-2 w-40 md:w-48 outline-none focus:border-2 focus:border-[#D4A373]"
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

            <div className="flex flex-col">
              <span className="mb-1 text-left pl-1">สถานที่</span>
              <input
                className="border rounded-lg px-3 py-2 w-40 md:w-48 outline-none focus:border-2 focus:border-[#D4A373]"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <span className="mb-1 text-left pl-1">Vaccinated</span>
              <select
                className="border rounded-lg px-3 py-2 w-40 md:w-48 outline-none focus:border-2 focus:border-[#D4A373]"
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

            {/* ปุ่มเสิร์จ */}
            <div className="flex items-end">
              <button
                className="border rounded-lg cursor-pointer bg-[#FEFAE0] hover:bg-[#FAEDCD] 
                       w-20 md:w-20 h-[42px] flex items-center justify-center"
              >
                <FaSearch />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 ml-12">
            {sortedPosts.map((post: any) => (
              <div
                key={post.post_id}
                className="relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-white group border border-gray-100"
              >
                <Link
                  key={post.post_id}
                  href={`/rehoming-report/${post.post_id}`}
                  className="flex flex-col"
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

                  {/* Content */}
                  <div className="p-4 text-sm md:text-base text-gray-700 space-y-2">
                    <h3 className="text-xl font-semibold text-[#D4A373] truncate">
                      {post.pet_name}
                    </h3>

                    <p className="flex items-center gap-2">
                      <HiOutlineTag className="text-[#D4A373]" />{" "}
                      {post.type || "ไม่ระบุ"}
                    </p>

                    <p className="flex items-center gap-2">
                      {post.sex === "MALE" ? (
                        <FaMars className="text-blue-500" />
                      ) : post.sex === "FEMALE" ? (
                        <FaVenus className="text-pink-500" />
                      ) : (
                        <FaGenderless className="text-gray-400" />
                      )}
                      {getSexLabel(post.sex)}
                    </p>

                    <p className="flex items-center gap-2">
                      <HiOutlineCalendar className="text-[#D4A373]" /> อายุ:{" "}
                      {post.age || "ไม่ระบุ"}
                    </p>

                    <p className="flex items-center gap-2">
                      <MdOutlineQuestionAnswer className="text-[#D4A373]" />{" "}
                      เหตุผล:{" "}
                      <span className="truncate">
                        {post.reason || "ไม่ระบุ"}
                      </span>
                    </p>

                    <p className="flex items-center gap-2">
                      <HiOutlinePhone className="text-[#D4A373]" />{" "}
                      {post.phone || "ไม่ระบุ"}
                    </p>

                    <p className="flex items-center gap-2">
                      <FiMapPin className="text-red-500" />
                      <span className="truncate">
                        {post.address || "ไม่ระบุ"}
                      </span>
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-4 text-xs md:text-sm pt-3 border-t mt-2 px-4">
                    <div className="flex items-center gap-2 truncate">
                      {healthStatusIcons[post.vaccination_status]?.icon}
                      <span>
                        {healthStatusIcons[post.vaccination_status]?.label ||
                          "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      {neuteredstatusIcons[post.neutered_status]?.icon}
                      <span>
                        {neuteredstatusIcons[post.neutered_status]?.label ||
                          "ไม่ระบุ"}
                      </span>
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
