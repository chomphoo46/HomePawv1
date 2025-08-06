"use client";
import React from "react";
import { HiOutlineCamera } from "react-icons/hi2";
import { GoHeart } from "react-icons/go";
import { BiUser } from "react-icons/bi";
import { RiUserFollowLine } from "react-icons/ri";
import { GoHome } from "react-icons/go";
import { RiContactsBook3Line } from "react-icons/ri";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<string>("home");
  const router = useRouter();
  const pathname = usePathname();

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
    <header className="flex items-center justify-between px-6 py-8 pl-12 shadow">
      <h1 className="text-xl font-semibold">HomePaw</h1>
      <div className="flex space-x-2">
        <div className="relative group">
          <span
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors
            ${
              pathname === "/" ? "text-[#D4A373]" : "text-black"
            } group-hover:text-[#D4A373]`}
          >
            <GoHome size={20} />
          </span>
          <button
            className={`px-4 py-2 pl-10 cursor-pointer transition-colors
              ${pathname === "/" ? "text-[#D4A373]" : ""} hover:text-[#D4A373]`}
            onClick={() => router.push("/")}
          >
            หน้าหลัก
          </button>
        </div>
        <div className="relative group">
          <span
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors
            ${
              pathname === "/animal-report" ? "text-[#D4A373]" : "text-black"
            } group-hover:text-[#D4A373]`}
          >
            <HiOutlineCamera size={20} />
          </span>
          <button
            className={`px-4 py-2 pl-10 cursor-pointer transition-colors
              ${
                pathname === "/animal-report" ? "text-[#D4A373]" : ""
              } hover:text-[#D4A373]`}
            onClick={() => router.push("/animal-report")}
          >
            แจ้งพบสัตว์ไร้บ้าน
          </button>
        </div>
        <div className="relative group">
          <span
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors
            ${
              pathname === "/rehoming-report" ? "text-[#D4A373]" : "text-black"
            } group-hover:text-[#D4A373]`}
          >
            <GoHeart size={20} />
          </span>
          <button
            className={`px-4 py-2 pl-10 cursor-pointer transition-colors
              ${
                pathname === "/rehoming-report" ? "text-[#D4A373]" : ""
              } hover:text-[#D4A373]`}
            onClick={() => router.push("/rehoming-report")}
          >
            หาบ้านให้สัตว์เลี้ยง
          </button>
        </div>
        <div className="relative group">
          <span
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors
            ${
              pathname === "/contract" ? "text-[#D4A373]" : "text-black"
            } group-hover:text-[#D4A373]`}
          >
            <RiContactsBook3Line size={20} />
          </span>
          <button
            className={`px-4 py-2 pl-10 cursor-pointer transition-colors
              ${
                pathname === "/contract" ? "text-[#D4A373]" : ""
              } hover:text-[#D4A373]`}
            onClick={() => router.push("/contract")}
          >
            ติดต่อเรา
          </button>
        </div>
        <div className="relative">
          {userName ? (
            <>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                <RiUserFollowLine size={20} />
              </span>
              <button
                className="px-4 py-2 pl-10 rounded-full hover:bg-gray-100 bg-[#FAEDCD] cursor-pointer"
                onClick={() => setShowMenu((v) => !v)}
              >
                {userName}
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-10">
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link href="/login">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                <BiUser size={20} />
              </span>
              <button className="px-4 py-2 pl-10 rounded-full hover:bg-gray-100 bg-[#FAEDCD] cursor-pointer">
                เข้าสู่ระบบ / สมัครสมาชิก
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
