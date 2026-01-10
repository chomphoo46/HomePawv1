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
  FaExclamationCircle,
} from "react-icons/fa";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { FiMapPin } from "react-icons/fi";
import { FaCircleCheck, FaLocationDot } from "react-icons/fa6";
import Link from "next/link";
import { Mali } from "next/font/google";
import { MdModeEdit, MdPets, MdOutlineQuestionAnswer } from "react-icons/md";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rehoming" | "found">("rehoming");

  const [rehomingPosts, setRehomingPosts] = useState<any[]>([]);
  const [foundPosts, setFoundPosts] = useState<any[]>([]);

  // ดึงข้อมูลหาบ้าน
  const fetchRehomingPosts = async () => {
    try {
      const res = await fetch("/api/rehoming-report/my-posts", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setRehomingPosts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ดึงข้อมูลแจ้งพบสัตว์ไร้บ้าน
  const fetchFoundPosts = async () => {
    try {
      const res = await fetch("/api/animal-report/my-posts", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setFoundPosts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchRehomingPosts(), fetchFoundPosts()]);
      setLoading(false);
    };
    initData();
  }, []);

  // ตัวแปรสำหรับข้อมูลปัจจุบัน
  const currentPosts = activeTab === "rehoming" ? rehomingPosts : foundPosts;

  // Icons Helper
  const healthStatusIcons: Record<
    string,
    { label: string; icon: JSX.Element }
  > = {
    VACCINATED: {
      label: "ฉีดวัคซีนแล้ว",
      icon: <FaCircleCheck size={18} style={{ color: "green" }} />,
    },
    NOT_VACCINATED: {
      label: "ยังไม่ได้ฉีดวัคซีน",
      icon: <FaTimesCircle size={18} style={{ color: "red" }} />,
    },
  };

  const neuteredstatusIcons: Record<
    string,
    { label: string; icon: JSX.Element }
  > = {
    NEUTERED: {
      label: "ทำหมันแล้ว",
      icon: <FaCircleCheck size={18} style={{ color: "green" }} />,
    },
    NOT_NEUTERED: {
      label: "ยังไม่ได้ทำหมัน",
      icon: <FaTimesCircle size={18} style={{ color: "red" }} />,
    },
  };

  // Helper แปลสถานะแจ้งพบ
  const getFoundStatusLabel = (status: string) => {
    switch (status) {
      case "STILL_THERE":
        return "ยังอยู่ที่เดิม";
      case "RESCUED":
        return "ช่วยเหลือแล้ว";
      case "MOVED":
        return "ย้ายที่แล้ว";
      case "OTHER":
        return "อื่นๆ";
      default:
        return status;
    }
  };

  const getBehaviorLabel = (behavior: string) => {
    switch (behavior) {
      case "friendly":
        return "เชื่อง เข้าหาคนได้";
      case "aggressive":
        return "ดุร้าย";
      case "injured":
        return "บาดเจ็บ ต้องการความช่วยเหลือ";
      default:
        return "อื่นๆ";
    }
  };

  const handleDelete = async (id: number) => {
    // ID เป็น number ตาม Schema
    const confirmDelete = confirm("คุณแน่ใจว่าต้องการลบโพสต์นี้?");
    if (!confirmDelete) return;

    const endpoint =
      activeTab === "rehoming"
        ? "/api/rehoming-report/my-posts"
        : "/api/animal-report/my-posts";

    const body = activeTab === "rehoming" ? { post_id: id } : { report_id: id };

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("ลบโพสต์ไม่สำเร็จ");

      if (activeTab === "rehoming") fetchRehomingPosts();
      else fetchFoundPosts();

      alert("ลบโพสต์เรียบร้อย");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
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

        {/* Tab Buttons */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-2xl shadow-sm">
            <nav className="flex space-x-0">
              <button
                onClick={() => setActiveTab("rehoming")}
                className={`flex-1 py-4 px-6 text-center font-semibold rounded-t-2xl transition-all duration-200 flex justify-center items-center gap-2 ${
                  activeTab === "rehoming"
                    ? "bg-linear-to-br from-[#FEFAE0] via-white to-[#F4F3EE] text-[#D4A373] shadow-lg border-t-2 border-[#D4A373]"
                    : "text-gray-500 hover:text-[#D4A373] hover:bg-orange-50"
                }`}
              >
                <span>🐶 หาบ้านให้น้อง</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {rehomingPosts.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("found")}
                className={`flex-1 py-4 px-6 text-center font-semibold rounded-t-2xl transition-all duration-200 flex justify-center items-center gap-2 ${
                  activeTab === "found"
                    ? "bg-linear-to-r from-green-50 to-emerald-50 text-emerald-600 shadow-lg border-t-2 border-emerald-500"
                    : "text-gray-500 hover:text-emerald-500 hover:bg-green-50"
                }`}
              >
                <span>📢 แจ้งพบสัตว์</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {foundPosts.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">
            กำลังโหลดข้อมูล...
          </div>
        ) : currentPosts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
            <p className="text-lg text-gray-500">ยังไม่มีรายการในหมวดนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentPosts.map((post: any) => {
              // Normalize ID and Fields based on Tab
              const isRehome = activeTab === "rehoming";
              const id = isRehome ? post.post_id : post.report_id;
              const title = isRehome ? post.pet_name : post.animal_type; // Rehome ใช้ชื่อ, Found ใช้ชนิดสัตว์
              const location = isRehome ? post.address : post.location;
              const image = post.images?.[0]?.image_url;

              return (
                <div
                  key={id}
                  className="relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-white border border-gray-100 group flex flex-col h-full"
                >
                  <Link
                    href={
                      isRehome
                        ? `/rehoming-report/${id}`
                        : `/animal-report/${id}`
                    }
                    className="flex flex-col h-full"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          ไม่มีรูปภาพ
                        </div>
                      )}
                      <div
                        className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm ${
                          isRehome ? "bg-[#D4A373]" : "bg-emerald-500"
                        }`}
                      >
                        {isRehome ? "หาบ้าน" : "พบเห็นสัตว์"}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex flex-col grow gap-3">
                      {/* Header with Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h2
                          className={`font-bold text-lg line-clamp-2 flex-1 ${
                            isRehome ? "text-[#D4A373]" : "text-emerald-600"
                          }`}
                        >
                          {title || "ไม่ระบุ"}
                        </h2>
                      </div>

                      {/* Info List - Vertical */}
                      <div className="space-y-2.5">
                        {/* Location */}
                        <div className="flex items-start gap-2.5">
                          <FiMapPin className="text-[#D4A373] shrink-0" />
                          <span className="text-sm text-gray-700 line-clamp-1 flex-1">
                            {location || "ไม่ระบุพิกัด"}
                          </span>
                        </div>

                        {/* Type-Specific Info */}
                        {isRehome ? (
                          <>
                            <div className="flex items-center gap-2.5">
                              <HiOutlineTag className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                {post.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {post.sex === "MALE" ? (
                                <>
                                  <FaMars className="text-blue-500 shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    ผู้
                                  </span>
                                </>
                              ) : post.sex === "FEMALE" ? (
                                <>
                                  <FaVenus className="text-pink-500 shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    เมีย
                                  </span>
                                </>
                              ) : (
                                <>
                                  <FaGenderless className="text-gray-400 shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    ไม่ระบุเพศ
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5">
                              <HiOutlineCalendar className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                อายุ: {post.age || "ไม่ระบุ"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <MdOutlineQuestionAnswer className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                เหตุผล: {post.reason || "ไม่ระบุ"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <HiOutlinePhone className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                {post.phone}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start gap-2.5">
                              <HiOutlineTag className="text-[#D4A373] shrink-0" />
                              <p className="text-sm text-gray-700">
                                ลักษณะ:{" "}
                                {post.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                              </p>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <MdPets className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                พฤติกรรม: {getBehaviorLabel(post.behavior)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer Section */}
                      {isRehome ? (
                        <div className="px-4 pb-4 pt-2 mt-auto">
                          <div className="flex items-center justify-between gap-4 text-xs md:text-sm pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 truncate min-w-0">
                              <span className="shrink-0">
                                {
                                  healthStatusIcons[post.vaccination_status]
                                    ?.icon
                                }
                              </span>
                              <span className="truncate">
                                {healthStatusIcons[post.vaccination_status]
                                  ?.label || "ไม่ระบุ"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 truncate min-w-0">
                              <span className="shrink-0">
                                {
                                  neuteredstatusIcons[post.neutered_status]
                                    ?.icon
                                }
                              </span>
                              <span className="truncate">
                                {neuteredstatusIcons[post.neutered_status]
                                  ?.label || "ไม่ระบุ"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5 border-t border-gray-100 pt-3 mt-auto">
                          <FaExclamationCircle className="text-orange-400 mt-0.5 shrink-0 text-base" />
                          <span className="text-sm text-gray-700">
                            สถานะ: {getFoundStatusLabel(post.status)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Actions (Delete / Edit) */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(id);
                      }}
                      className="bg-white/90 p-2 rounded-full shadow hover:text-red-600 text-gray-400"
                    >
                      <FaTrash size={14} />
                    </button>
                    <Link
                      href={
                        isRehome
                          ? `/rehoming-report/edit/${id}`
                          : `/animal-report/edit/${id}`
                      }
                      className="bg-white/90 p-2 rounded-full shadow hover:text-blue-600 text-gray-400 flex items-center justify-center"
                    >
                      <MdModeEdit size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
