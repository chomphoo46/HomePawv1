"use client";
import React, { useEffect, useState, useRef, JSX } from "react";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { FaMars, FaVenus, FaGenderless, FaTimesCircle } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { GoHeart } from "react-icons/go";
import { FiMapPin } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { Mali } from "next/font/google";
const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

export default function HomePage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [stats, setStats] = useState({
    foundAnimals: 0,
    rehomingPosts: 0,
    urgentHelp: 0,
  });

  // Mapping ค่าเพศ
  const sexLabels: Record<string, { label: string; icon: JSX.Element }> = {
    MALE: { label: "เพศ:  ผู้", icon: <FaMars /> },
    FEMALE: { label: "เพศ:  เมีย", icon: <FaVenus /> },
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

  useEffect(() => {
    const name = localStorage.getItem("userName");
    setUserName(name);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/rehoming-report", { cache: "no-store" });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");

        const data = await res.json();
        const sorted = data.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPosts(sorted.slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    }
    fetchPosts();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/rehoming-report", { cache: "no-store" });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");

        const data = await res.json();

        const foundAnimals = data.filter(
          (post: any) => post.status === "FOUND"
        ).length;
        const rehomingPosts = data.length;
        const urgentHelp = data.filter((post: any) => post.is_urgent).length;

        setStats({
          foundAnimals,
          rehomingPosts,
          urgentHelp,
        });
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userName");
    setUserName(null);
    setShowMenu(false);
    window.location.reload();
  };

  return (
    <div className={`min-h-screen bg-white text-gray-800 ${mali.className}`}>
      {/* Header */}
      <Header />

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center py-6 px-4">
        {[
          ["สัตว์ไร้บ้านที่พบ", stats.foundAnimals, "text-[#D4A373]"],
          ["ประกาศหาบ้าน", stats.rehomingPosts, "text-purple-600"],
          ["คนช่วยเหลือ", 0, "text-green-600"], // TODO: เพิ่มภายหลัง
          ["ต้องการช่วยเหลือด่วน", stats.urgentHelp, "text-red-500"],
        ].map(([label, count, color], i) => (
          <div key={i}>
            <p className={`text-xl font-bold ${color}`}>{count}</p>
            <p className={color as string}>{label}</p>
          </div>
        ))}
      </section>

      {/* Map Section */}
      <section className="px-4 py-8">
        <div className="flex items-center justify-between mb-2 py-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
              <FiMapPin size={20} />
            </span>
            <h2 className="font-semibold text-lg pl-12">แผนที่สัตว์ไร้บ้าน</h2>
          </div>
          <div className="space-x-2">
            {["ทั้งหมด", "สุนัข", "แมว", "ล่าสุด"].map((btn, idx) => (
              <button
                key={idx}
                className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 cursor-pointer"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-[500px] rounded overflow-hidden border">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.920703807358!2d100.49050827605068!3d13.742781186617898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e299299aa06d4d%3A0xcef2d26d6265c555!2z4Lij4Liy4Liy4Lij4Liw4LiZ4Liq4Liy4LiE4Liy4LiH4LiZ4LiE4Li44LiZ4LmA4Lin4Lih4LiZ!5e0!3m2!1sth!2sth!4v1700000000000!5m2!1sth!2sth"
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="px-4 py-8">
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
            <GoHeart size={20} />
          </span>
          <h2 className="font-semibold text-lg mb-4 pl-12">
            ประกาศหาบ้านล่าสุด
          </h2>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {posts.map((post) => (
              <div
                key={post.post_id}
                className="rounded-2xl p-4 shadow hover:shadow-lg transition"
              >
                {post.images?.length > 0 && (
                  <img
                    src={post.images[0].image_url}
                    alt={post.pet_name}
                    className="w-full h-48 object-cover mb-2 rounded-lg"
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
                  {sexLabels[post.sex]?.icon}
                  {sexLabels[post.sex]?.label || "ไม่ระบุ"}
                </p>
                <p className="flex items-center gap-2">
                  <HiOutlineCalendar />
                  อายุ: {post.age}
                </p>
                <p className="flex items-center gap-2">
                  <MdOutlineQuestionAnswer />
                  เหตุผล: {post.reason}
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
          <div className="text-center border border-[#D4A373] rounded-2xl mt-4 p-2">
            <button
              onClick={() => router.push("/rehoming-report")}
              className="text-base text-[#D4A373] hover:underline font-medium cursor-pointer"
            >
              ดูประกาศทั้งหมด →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
