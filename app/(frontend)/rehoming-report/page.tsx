"use client";

import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaSearch,
  FaMars,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSyringe,
} from "react-icons/fa";

const mockPets = Array.from({ length: 9 }).map((_, i) => ({
  id: i + 1,
  name: "Buddy",
  age: "",
  gender: "male",
  location: "",
  vaccinated: i % 2 === 0,
  image: "",
}));

export default function RehomingReportPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    breed: "",
    gender: "",
    age: "",
    location: "",
    vaccinated: "",
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-start ">
        {/* Banner */}
        <div className="w-full h-80  shadow p-8 mb-8 flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-10">
            “หนึ่งการรับเลี้ยง เปลี่ยนหนึ่งชีวิต”
          </h1>
          <button className="bg-[#D4A373] hover:bg-[#d4a373cd] text-lg text-white px-8 py-2  rounded-3xl font-semibold mb-10 mt-10 cursor-pointer"
            onClick={() => router.push("/form-rehoming")}>
            หาบ้านให้สัตว์เลี้ยงของคุณ คลิกที่นี่
          </button>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 w-full justify-center mb-8 mt-8 ">
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
              value={filters.gender}
              onChange={(e) =>
                setFilters({ ...filters, gender: e.target.value })
              }
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
              <option value="vaccinated">ฉีดวัดซีนแล้ว</option>
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
            กำลังแสดง 24 จากทั้งหมด 156
          </span>
          <select className="border rounded px-2 py-1 text-sm">
            <option>เรียงตาม: ใหม่ล่าสุด</option>
            <option>เรียงตาม: เก่าที่สุด</option>
          </select>
        </div>

        {/* Pet cards grid */}
        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {mockPets.map((pet) => (
            <div
              key={pet.id}
              className="border rounded-lg bg-gray-50 flex flex-col p-4 shadow"
            >
              {/* Image */}
              <div className="bg-gray-300 rounded w-full h-36 flex items-center justify-center mb-3">
                <span className="text-4xl text-gray-400">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M9.172 14.828a4 4 0 0 1 5.656 0M15 10h.01M9 10h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              {/* Info */}
              <div className="font-semibold mb-1">{pet.name}</div>
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <FaCalendarAlt className="mr-1" /> {/* วันเกิด/อายุ */}
                <span className="w-20 h-3 bg-gray-200 rounded mr-2"></span>
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <FaMars className="mr-1" /> {/* เพศ */}
                <span className="w-16 h-3 bg-gray-200 rounded mr-2"></span>
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-2">
                <FaMapMarkerAlt className="mr-1" /> {/* สถานที่ */}
                <span className="w-24 h-3 bg-gray-200 rounded"></span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    pet.vaccinated
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <FaSyringe className="mr-1" />
                  วัคซีนแล้ว
                </span>
                <span
                  className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    !pet.vaccinated
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <FaSyringe className="mr-1" />
                  ยังไม่ได้ทำหมัน
                </span>
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 bg-gray-200 hover:bg-gray-300 rounded py-2 font-medium">
                  สนใจรับเลี้ยง
                </button>
                <button className="flex-1 bg-gray-200 hover:bg-gray-300 rounded py-2 font-medium">
                  ติดต่อ
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex gap-1 items-center">
          <button className="border rounded px-2 py-1 text-sm bg-gray-100">
            &lt;
          </button>
          <button className="border rounded px-2 py-1 text-sm bg-gray-300 font-bold">
            1
          </button>
          <button className="border rounded px-2 py-1 text-sm bg-gray-100">
            2
          </button>
          <button className="border rounded px-2 py-1 text-sm bg-gray-100">
            3
          </button>
          <span className="px-2 text-gray-400">...</span>
          <button className="border rounded px-2 py-1 text-sm bg-gray-100">
            7
          </button>
          <button className="border rounded px-2 py-1 text-sm bg-gray-100">
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
