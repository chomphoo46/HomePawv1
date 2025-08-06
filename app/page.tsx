"use client";
import React from "react";
import { HiOutlineCamera } from "react-icons/hi2";
import { GoHeart } from "react-icons/go";
import { FiMapPin } from "react-icons/fi";
import { BiUser } from "react-icons/bi";
import { RiUserFollowLine } from "react-icons/ri";
import { GoHome } from "react-icons/go";
import { RiContactsBook3Line } from "react-icons/ri";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

export default function HomePage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<string>("home");
  const router = useRouter();

  useEffect(() => {
    // ดึงชื่อผู้ใช้จาก localStorage
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

  const handleLogout = () => {
    localStorage.removeItem("userName");
    setUserName(null);
    setShowMenu(false);
    window.location.reload();
  };
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <Header />

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center py-6 px-4 ">
        {[
          ["สัตว์ไร้บ้านที่พบ", 0, "text-[#D4A373]"],
          ["ประกาศหาบ้าน", 0, "text-purple-600"],
          ["คนช่วยเหลือ", 0, "text-green-600"],
          ["ต้องการช่วยเหลือด่วน", 0, "text-red-500"],
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
          <div className="space-x-2 ">
            <button className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 cursor-pointer">
              ทั้งหมด
            </button>
            <button className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 cursor-pointer">
              สุนัข
            </button>
            <button className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 cursor-pointer">
              แมว
            </button>
            <button className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 cursor-pointer">
              ล่าสุด
            </button>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
          <div className="text-center border border-[#D4A373] rounded-2xl mt-4 p-2 ">
            <button className="text-base  text-[#D4A373] hover:underline font-medium cursor-pointer">
              ดูประกาศทั้งหมด →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
