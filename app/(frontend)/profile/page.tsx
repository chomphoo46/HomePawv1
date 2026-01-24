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
  FaClipboardList, // Icon สำหรับ Tab ใหม่
  FaClock,
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
  const [activeTab, setActiveTab] = useState<
    "rehoming" | "found" | "my-requests"
  >("rehoming");

  const [rehomingPosts, setRehomingPosts] = useState<any[]>([]);
  const [foundPosts, setFoundPosts] = useState<any[]>([]);
  const [adoptionRequests, setAdoptionRequests] = useState<any[]>([]);
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
  // 2. เพิ่มฟังก์ชันดึงข้อมูลคำขอ
  const fetchAdoptionRequests = async () => {
    try {
      const res = await fetch("/api/adopt/my-request", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setAdoptionRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchRehomingPosts(),
        fetchFoundPosts(),
        fetchAdoptionRequests(), // เรียก function ใหม่
      ]);
      setLoading(false);
    };
    initData();
  }, []);

  // ตัวแปรสำหรับข้อมูลปัจจุบัน
  const currentPosts =
    activeTab === "rehoming"
      ? rehomingPosts
      : activeTab === "found"
        ? foundPosts
        : adoptionRequests;

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
  // ฟังก์ชันสำหรับแสดงป้ายสถานะ (APPROVED/REJECTED/PENDING)
  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold border border-green-200 flex items-center gap-1 w-fit">
            <FaCircleCheck /> อนุมัติแล้ว
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold border border-red-200 flex items-center gap-1 w-fit">
            <FaTimesCircle /> ไม่ผ่านการอนุมัติ
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold border border-yellow-200 flex items-center gap-1 w-fit">
            <FaClock /> รอตรวจสอบ
          </span>
        );
    }
  };

  const handleDelete = async (id: number) => {
    if (activeTab === "my-requests") return; // Tab คำขอ ลบไม่ได้ (หรือต้องทำ API ยกเลิกคำขอเพิ่ม)

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
            กิจกรรมของฉัน
          </h1>
          <p className="text-gray-600">
            ติดตามสถานะการขอรับเลี้ยง และจัดการโพสต์ของคุณได้ที่นี่
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-2xl shadow-sm">
            <nav className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-0">
              {/* Tab 1: Rehoming */}
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
              {/* Tab 3: Found */}
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

              {/* Tab 2: Requests (New!) */}
              <button
                onClick={() => setActiveTab("my-requests")}
                className={`flex-1 py-4 px-6 text-center font-semibold rounded-t-2xl transition-all duration-200 flex justify-center items-center gap-2 ${
                  activeTab === "my-requests"
                    ? "bg-linear-to-br from-blue-50 via-white to-indigo-50 text-blue-600 shadow-lg border-t-2 border-blue-500"
                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <span>📋 ติดตามสถานะ</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {adoptionRequests.length}
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
            {currentPosts.map((item: any) => {
              // Logic การแยกตัวแปรตาม Tab
              const isRequestTab = activeTab === "my-requests";
              const isRehomeTab = activeTab === "rehoming";

              // ถ้าเป็น Request ข้อมูลสัตว์จะอยู่ใน item.post ถ้าเป็น Tab อื่น ข้อมูลอยู่ที่ item เลย
              const data = isRequestTab ? item.post : item;

              const id = isRehomeTab
                ? item.post_id
                : isRequestTab
                  ? item.id
                  : item.report_id;
              const title = isRequestTab
                ? data?.pet_name
                : isRehomeTab
                  ? item.pet_name
                  : item.animal_type;
              const image =
                data?.images?.[0]?.image_url || item.images?.[0]?.image_url;
              const location = isRehomeTab
                ? item.address
                : isRequestTab
                  ? data?.address
                  : item.location;

              return (
                <div
                  key={id}
                  className="relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-white border border-gray-100 group flex flex-col h-full"
                >
                  <Link
                    // ถ้าเป็น Request ให้ลิงก์ไปหน้าสัตว์ตัวนั้น (rehoming-report)
                    href={
                      isRehomeTab || isRequestTab
                        ? `/rehoming-report/${data?.post_id || item.post_id}`
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
                          isRehomeTab
                            ? "bg-[#D4A373]"
                            : isRequestTab
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                        }`}
                      >
                        {isRehomeTab
                          ? "หาบ้าน"
                          : isRequestTab
                            ? "ขอเลี้ยง"
                            : "พบเห็น"}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex flex-col grow gap-3">
                      {/* กรณี Tab Request: แสดงสถานะตัวใหญ่ๆ */}
                      {isRequestTab && (
                        <div className="mb-1">
                          {getRequestStatusBadge(item.status)}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <h2
                          className={`font-bold text-lg line-clamp-2 flex-1 ${
                            isRehomeTab
                              ? "text-[#D4A373]"
                              : isRequestTab
                                ? "text-gray-800"
                                : "text-emerald-600"
                          }`}
                        >
                          {title || "ไม่ระบุชื่อ"}
                        </h2>
                      </div>

                      {/* Info List */}
                      <div className="space-y-2.5">
                        {/* ถ้าเป็น Request แสดงเหตุผลจากแอดมิน (ถ้ามี) */}
                        {isRequestTab && item.reason && (
                          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold mb-1">
                              💬 บันทึกจากแอดมิน:
                            </p>
                            <p className="text-sm text-gray-700 wrap-break-word">
                              {item.reason}
                            </p>
                          </div>
                        )}

                        <div className="flex items-start gap-2.5">
                          <FiMapPin className="text-[#D4A373] shrink-0" />
                          <span className="text-sm text-gray-700 line-clamp-1 flex-1">
                            {location || "ไม่ระบุพิกัด"}
                          </span>
                        </div>

                        {/* แสดงข้อมูลเฉพาะของแต่ละ Tab */}
                        {isRehomeTab ? (
                          <>
                            <div className="flex items-center gap-2.5">
                              <HiOutlineTag className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                {item.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {item.sex === "MALE" ? (
                                <>
                                  <FaMars className="text-blue-500 shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    ผู้
                                  </span>
                                </>
                              ) : item.sex === "FEMALE" ? (
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
                                อายุ: {item.age || "ไม่ระบุ"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <MdOutlineQuestionAnswer className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                เหตุผล: {item.reason || "ไม่ระบุ"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <HiOutlinePhone className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                {item.phone}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start gap-2.5">
                              <HiOutlineTag className="text-[#D4A373] shrink-0" />
                              <p className="text-sm text-gray-700">
                                ลักษณะ:{" "}
                                {item.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                              </p>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <MdPets className="text-[#D4A373] shrink-0" />
                              <span className="text-sm text-gray-700">
                                พฤติกรรม: {getBehaviorLabel(item.behavior)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer Section */}
                      {isRehomeTab ? (
                        <div className="px-4 pb-4 pt-2 mt-auto">
                          <div className="flex items-center justify-between gap-4 text-xs md:text-sm pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 truncate min-w-0">
                              <span className="shrink-0">
                                {
                                  healthStatusIcons[item.vaccination_status]
                                    ?.icon
                                }
                              </span>
                              <span className="truncate">
                                {healthStatusIcons[item.vaccination_status]
                                  ?.label || "ไม่ระบุ"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 truncate min-w-0">
                              <span className="shrink-0">
                                {
                                  neuteredstatusIcons[item.neutered_status]
                                    ?.icon
                                }
                              </span>
                              <span className="truncate">
                                {neuteredstatusIcons[item.neutered_status]
                                  ?.label || "ไม่ระบุ"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5 border-t border-gray-100 pt-3 mt-auto">
                          <FaExclamationCircle className="text-orange-400 mt-0.5 shrink-0 text-base" />
                          <span className="text-sm text-gray-700">
                            สถานะ: {getFoundStatusLabel(item.status)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {!isRequestTab && (
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
                          isRehomeTab
                            ? `/rehoming-report/edit/${id}`
                            : `/animal-report/edit/${id}`
                        }
                        className="bg-white/90 p-2 rounded-full shadow hover:text-blue-600 text-gray-400 flex items-center justify-center"
                      >
                        <MdModeEdit size={16} />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
