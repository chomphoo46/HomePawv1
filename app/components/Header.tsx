"use client";
import React, { useEffect, useState, useRef } from "react";
import { HiOutlineCamera } from "react-icons/hi2";
import { GoHeart, GoHome } from "react-icons/go";
import { BiUser } from "react-icons/bi";
import { RiUserFollowLine, RiContactsBook3Line } from "react-icons/ri";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession(); // ✅ ดึงข้อมูลจาก NextAuth
  const [userName, setUserName] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name);
      localStorage.setItem("userName", session.user.name); // เก็บใน localStorage เผื่อ refresh
    } else {
      const nameFromLocal = localStorage.getItem("username");
      setUserName(nameFromLocal);
    }
  }, [session]);

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
    localStorage.removeItem("username");
    setUserName(null);
    setShowMenu(false);
    signOut({ callbackUrl: "/" }); // ✅ ออกจากระบบ NextAuth
  };

  return (
    <header className="flex items-center justify-between px-6 py-8 pl-12 shadow">
      <h1 className="text-2xl font-semibold">HomePaw</h1>
      <div className="flex space-x-2">
        <NavButton
          icon={<GoHome size={20} />}
          label="หน้าหลัก"
          active={pathname === "/"}
          onClick={() => router.push("/")}
        />
        <NavButton
          icon={<HiOutlineCamera size={20} />}
          label="แจ้งพบสัตว์ไร้บ้าน"
          active={pathname === "/animal-report"}
          onClick={() => router.push("/animal-report")}
        />
        <NavButton
          icon={<GoHeart size={20} />}
          label="หาบ้านให้สัตว์เลี้ยง"
          active={pathname === "/rehoming-report"}
          onClick={() => router.push("/rehoming-report")}
        />
        <NavButton
          icon={<RiContactsBook3Line size={20} />}
          label="ติดต่อเรา"
          active={pathname === "/contract"}
          onClick={() => router.push("/contract")}
        />
        <div className="relative" ref={menuRef}>
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
                    className="block w-full text-left text-sm px-4 py-2 hover:bg-gray-100"
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

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group">
      <span
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          active ? "text-[#D4A373]" : "text-black"
        } group-hover:text-[#D4A373]`}
      >
        {icon}
      </span>
      <button
        className={`px-4 py-2 pl-10 cursor-pointer transition-colors ${
          active ? "text-[#D4A373]" : ""
        } hover:text-[#D4A373]`}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}
