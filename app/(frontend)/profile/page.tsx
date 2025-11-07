"use client";

import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import { useState, useEffect, JSX } from "react";
import {
  FaMars,
  FaVenus,
  FaGenderless,
  FaTimesCircle,
  FaTrash,
} from "react-icons/fa";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { FiMapPin } from "react-icons/fi";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FaCircleCheck } from "react-icons/fa6";
import Link from "next/link";
import { Mali } from "next/font/google";
import { MdModeEdit } from "react-icons/md";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

export default function ProfilePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rehoming" | "found">("rehoming");
  const [rehomingPosts, setRehomingPosts] = useState([]);
  const [foundPosts, setFoundPosts] = useState([]);
  const [formData, setFormData] = useState({
    phone: "",
    pet_name: "",
    type: "",
    sex: "",
    age: "",
    vaccination_status: "",
    neutered_status: "",
    address: "",
    contact: "",
    reason: "",
    images: [] as File[],
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rehoming-report/my-posts", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // ฟังก์ชันลบโพสต์
  const handleDelete = async (post_id: string) => {
    const confirmDelete = confirm("คุณแน่ใจว่าต้องการลบโพสต์นี้?");
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/rehoming-report/my-posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id }),
      });
      if (!res.ok) throw new Error("ลบโพสต์ไม่สำเร็จ");

      // รีเฟรช list หลังลบ
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  // ฟังก์ชันแก้ไขโพสต์
  const handleUpdate = async (post_id: string, formData: any) => {
    try {
      const res = await fetch("/api/rehoming-report/my-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id,
          formData, // เช่น { title, description, location }
        }),
      });

      if (!res.ok) throw new Error("แก้ไขโพสต์ไม่สำเร็จ");

      const updated = await res.json();
      console.log("อัปเดตโพสต์แล้ว:", updated);
      alert("แก้ไขโพสต์เรียบร้อย ✅");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการแก้ไขโพสต์");
    }
  };

  return (
    <div className={`min-h-screen bg-white ${mali.className}`}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            โพสต์ของฉัน
          </h1>
          <p className="text-gray-600">
            จัดการโพสต์หาบ้านและแจ้งพบสัตว์ไร้บ้านของคุณ
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-2xl shadow-sm">
            <nav className="flex space-x-0">
              <button
                onClick={() => setActiveTab("rehoming")}
                className={`flex-1 py-4 px-6 text-center font-semibold rounded-t-2xl transition-all duration-200 ${
                  activeTab === "rehoming"
                    ? "bg-gradient-to-br from-[#FEFAE0] via-white to-[#F4F3EE] text-[#D4A373] shadow-lg"
                    : "text-gray-600 hover:text-[#D4A373] hover:bg-orange-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  หาบ้านให้น้อง
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                    {posts.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("found")}
                className={`flex-1 py-4 px-6 text-center font-semibold rounded-t-2xl transition-all duration-200 ${
                  activeTab === "found"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-green-500 hover:bg-green-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  แจ้งพบสัตว์ไร้บ้าน
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                    {foundPosts.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 animate-pulse">กำลังโหลดโพสต์...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl shadow-inner">
            <p className="text-lg">คุณยังไม่มีโพสต์ประกาศหาบ้านสัตว์เลี้ยง</p>
            <p className="text-sm">ลองเพิ่มโพสต์ใหม่ดูสิ 🐶🐱</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {posts.map((post: any) => (
              <div
                key={post.post_id}
                className="relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-white group"
              >
                <Link
                  href={`/rehoming-report/${post.post_id}`}
                  className="flex flex-col"
                >
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

                  <div className="p-4 flex flex-col gap-2">
                    <h2 className="font-bold text-lg md:text-xl text-[#D4A373] line-clamp-1">
                      {post.pet_name}
                    </h2>

                    <div className="text-sm md:text-base text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <HiOutlineTag className="text-[#D4A373]" /> พันธุ์:{" "}
                        {post.type}
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
                        {post.age}
                      </p>
                      <p className="flex items-center gap-2">
                        <MdOutlineQuestionAnswer className="text-[#D4A373] flex-shrink-0" />{" "}
                        เหตุผล: {post.reason}
                      </p>
                      <p className="flex items-center gap-2">
                        <HiOutlinePhone className="text-[#D4A373]" />{" "}
                        {post.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <FiMapPin className="text-red-500 flex-shrink-0" />
                        <span className="truncate">{post.address}</span>
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
                  </div>
                </Link>

                {/* ปุ่มลบโพสต์ */}
                <button
                  onClick={() => handleDelete(post.post_id)}
                  className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-red-50 hover:text-red-600 transition"
                  title="ลบโพสต์"
                >
                  <FaTrash size={18} />
                </button>

                {/* ปุ่มแก้ไขโพสต์ */}
                <Link
                  href={`/rehoming-report/edit/${post.post_id}`}
                  className="absolute top-3 right-13 bg-white p-2 rounded-full shadow hover:bg-green-50 hover:text-green-600 transition"
                  title="แก้ไขโพสต์"
                >
                  <MdModeEdit size={20} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
