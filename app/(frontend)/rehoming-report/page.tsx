"use client";

import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FaSearch,
} from "react-icons/fa";

export default function RehomingReportPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({
    breed: "",
    gender: "",
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {posts.map((post: any) => (
            <div key={post.post_id} className="border rounded p-4">
              {post.images?.length > 0 && (
                <img
                  src={post.images[0].image_url}
                  alt={post.pet_name}
                  className="w-full h-48 object-cover mb-2"
                />
              )}
              <h2 className="font-bold">{post.pet_name}</h2>
              <p>ประเภท: {post.type}</p>
              <p>อายุ: {post.age}</p>
              <p>สุขภาพ: {post.health_status}</p>
              <p>ติดต่อ: {post.phone}</p>
              <p className="mt-2">{post.reason}</p>
            </div>
          ))}
        </div>

      
      </div>
    </div>
  );
}
