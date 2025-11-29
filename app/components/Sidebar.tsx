"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { FaPaw } from "react-icons/fa";
import { BiUser } from "react-icons/bi";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { name: "จัดการโพสต์", icon: FaPaw, href: "/admin/posts" },
  { name: "จัดการสมาชิก", icon: BiUser, href: "/admin/members" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "ผู้ใช้งาน";
  const userRole =
    session?.user?.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "ผู้ใช้งานทั่วไป";

  return (
    <aside className="w-60 bg-white flex flex-col justify-between min-h-screen">
      {/* ส่วนบน */}
      <div>
        <div className="p-4">
          <p className="font-medium text-lg">{userName}</p>
          <p className="text-xs text-gray-500">{userRole}</p>
        </div>

        {/* เมนู */}
        <nav className="mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-8 py-4 text-md transition-all",
                  active ? "bg-[#D4A373]" : "hover:bg-[#F9FAE0]"
                )}
              >
                <Icon className="w-6 h-6" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ส่วนล่าง */}
      <div className="p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 text-md text-gray-600 hover:text-red-500 w-full"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
