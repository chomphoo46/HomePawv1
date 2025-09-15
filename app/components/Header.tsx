"use client";
import React, { useEffect, useState, useRef } from "react";
import { HiOutlineCamera } from "react-icons/hi2";
import { GoHeart, GoHome } from "react-icons/go";
import { BiUser } from "react-icons/bi";
import { FiLogOut } from "react-icons/fi";
import { RiUserFollowLine, RiContactsBook3Line } from "react-icons/ri";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Mali } from "next/font/google";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

export default function Header() {
  const { data: session } = useSession();
  const [userName, setUserName] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name);
      localStorage.setItem("userName", session.user.name);
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
    signOut({ callbackUrl: "/" });
  };

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 shadow bg-[#FEFAE0] ${mali.className}`}
    >
      {/* Logo */}
      <h1 className="text-xl md:text-2xl font-semibold">HomePaw</h1>

      {/* Desktop Menu */}
      <nav className="hidden md:flex space-x-2 items-center ml-auto mr-4">
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
      </nav>

      {/* User / Login (Desktop + Mobile) */}
      <div className="relative" ref={menuRef}>
        {userName ? (
          <>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
              <RiUserFollowLine size={20} />
            </span>
            <button
              className="px-4 py-2 pl-10 rounded-full hover:bg-[#E9B480] bg-[#D4A373] cursor-pointer"
              onClick={() => setShowMenu((v) => !v)}
            >
              {userName}
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow z-10">
                {/* เมนูโปรไฟล์ */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 w-full text-left text-sm px-4 py-2 hover:bg-gray-100"
                >
                  <RiUserFollowLine size={18} className="text-black" />
                  <span>โพสต์ของฉัน</span>
                </Link>

                {/* เมนูออกจากระบบ */}
                <button
                  className="flex items-center gap-2 w-full text-left text-sm px-4 py-2 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <FiLogOut size={18} className="text-black" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <Link href="/login">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
              <BiUser size={20} />
            </span>
            <button className="px-4 py-2 pl-10 rounded-full hover:bg-[#E9B480] bg-[#D4A373] cursor-pointer">
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden ml-2"
        onClick={() => setShowMobileMenu((prev) => !prev)}
      >
        {showMobileMenu ? (
          <HiOutlineX size={24} />
        ) : (
          <HiOutlineMenu size={24} />
        )}
      </button>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="absolute top-16 left-0 w-full bg-[#FEFAE0] shadow-md flex flex-col items-start p-4 space-y-2 md:hidden z-20">
          <NavButton
            icon={<GoHome size={20} />}
            label="หน้าหลัก"
            active={pathname === "/"}
            onClick={() => {
              router.push("/");
              setShowMobileMenu(false);
            }}
          />
          <NavButton
            icon={<HiOutlineCamera size={20} />}
            label="แจ้งพบสัตว์ไร้บ้าน"
            active={pathname === "/animal-report"}
            onClick={() => {
              router.push("/animal-report");
              setShowMobileMenu(false);
            }}
          />
          <NavButton
            icon={<GoHeart size={20} />}
            label="หาบ้านให้สัตว์เลี้ยง"
            active={pathname === "/rehoming-report"}
            onClick={() => {
              router.push("/rehoming-report");
              setShowMobileMenu(false);
            }}
          />
          <NavButton
            icon={<RiContactsBook3Line size={20} />}
            label="ติดต่อเรา"
            active={pathname === "/contract"}
            onClick={() => {
              router.push("/contract");
              setShowMobileMenu(false);
            }}
          />
        </div>
      )}
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
    <div className="relative group w-full md:w-auto">
      <span
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          active ? "text-[#D4A373]" : "text-black"
        } group-hover:text-[#D4A373]`}
      >
        {icon}
      </span>
      <button
        className={`px-4 py-2 pl-10 w-full text-left md:text-center cursor-pointer transition-colors ${
          active ? "text-[#D4A373]" : ""
        } hover:text-[#D4A373]`}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}
