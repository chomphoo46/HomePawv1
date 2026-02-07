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
  FaClipboardList,
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
import InfoRow from "@/app/components/profile/InfoRow";
import TabButton from "@/app/components/profile/TabButton";
import StatusIcon from "@/app/components/profile/StatusIcon";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

const healthStatusIcons: Record<string, { label: string; icon: JSX.Element }> =
  {
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

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "rehoming" | "found" | "my-requests"
  >("rehoming");

  const [rehomingPosts, setRehomingPosts] = useState<any[]>([]);
  const [foundPosts, setFoundPosts] = useState<any[]>([]);
  const [adoptionRequests, setAdoptionRequests] = useState<any[]>([]);

  const fetchData = async (url: string, setter: (data: any[]) => void) => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setter(data);
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchData("/api/rehoming-report/my-posts", setRehomingPosts),
        fetchData("/api/animal-report/my-posts", setFoundPosts),
        fetchData("/api/adopt/my-request", setAdoptionRequests),
      ]);
      setLoading(false);
    };
    initData();
  }, []);

  const handleDelete = async (id: number) => {
    if (activeTab === "my-requests") return;

    if (!confirm("คุณแน่ใจว่าต้องการลบโพสต์นี้?")) return;

    const isRehoming = activeTab === "rehoming";
    const endpoint = isRehoming
      ? "/api/rehoming-report/my-posts"
      : "/api/animal-report/my-posts";
    const body = isRehoming ? { post_id: id } : { report_id: id };

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("ลบโพสต์ไม่สำเร็จ");

      // Refetch เฉพาะส่วนที่ลบ
      if (isRehoming)
        fetchData("/api/rehoming-report/my-posts", setRehomingPosts);
      else fetchData("/api/animal-report/my-posts", setFoundPosts);

      alert("ลบโพสต์เรียบร้อย");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  const currentPosts =
    activeTab === "rehoming"
      ? rehomingPosts
      : activeTab === "found"
        ? foundPosts
        : adoptionRequests;

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
              <TabButton
                label="หาบ้านให้น้อง"
                count={rehomingPosts.length}
                isActive={activeTab === "rehoming"}
                onClick={() => setActiveTab("rehoming")}
                activeColor="text-[#D4A373] border-[#D4A373] bg-linear-to-br from-[#FEFAE0] via-white to-[#F4F3EE]"
                hoverColor="hover:text-[#D4A373] hover:bg-orange-50"
              />
              <TabButton
                label="แจ้งพบสัตว์"
                count={foundPosts.length}
                isActive={activeTab === "found"}
                onClick={() => setActiveTab("found")}
                activeColor="text-emerald-600 border-emerald-500 bg-linear-to-r from-green-50 to-emerald-50"
                hoverColor="hover:text-emerald-500 hover:bg-green-50"
              />
              <TabButton
                label="ติดตามสถานะสัตว์ที่ขอรับเลี้ยง"
                count={adoptionRequests.length}
                isActive={activeTab === "my-requests"}
                onClick={() => setActiveTab("my-requests")}
                activeColor="text-blue-600 border-blue-500 bg-linear-to-br from-blue-50 via-white to-indigo-50"
                hoverColor="hover:text-blue-600 hover:bg-blue-50"
              />
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
              const isRequestTab = activeTab === "my-requests";
              const isRehomeTab = activeTab === "rehoming";
              const isFoundTab = activeTab === "found";

              // --- 3. Normalization Data (จัดการตัวแปรให้เหมือนกัน) ---
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

              // --- 4. Logic ตัวช่วย (Helper Logic) ---
              const isAdopted = isRehomeTab && item.status === "ADOPTED";

              // กำหนด Badge Config
              let badgeConfig = { text: "พบเห็น", color: "bg-emerald-500" }; // Default (Found)
              if (isRehomeTab) {
                badgeConfig = isAdopted
                  ? { text: "ได้บ้านแล้ว", color: "bg-green-500" }
                  : { text: "หาบ้าน", color: "bg-[#D4A373]" };
              } else if (isRequestTab) {
                badgeConfig = { text: "ขอเลี้ยง", color: "bg-blue-500" };
              }

              return (
                <div
                  key={id}
                  className={`relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100 group flex flex-col h-full ${
                    isAdopted ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  <Link
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
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            isAdopted ? "grayscale opacity-75" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          ไม่มีรูปภาพ
                        </div>
                      )}
                      <div
                        className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm ${badgeConfig.color}`}
                      >
                        {badgeConfig.text}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5 flex flex-col grow gap-3">
                      {isRequestTab && (
                        <div className="mb-1">
                          {getRequestStatusBadge(item.status)}
                        </div>
                      )}

                      <div className="space-y-2.5">
                        {isRequestTab && item.reason && (
                          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold mb-1">
                              เหตุผลจากแอดมิน:
                            </p>
                            <p className="text-sm text-gray-700 wrap-break-word">
                              {item.reason}
                            </p>
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

                        <div className="flex items-start gap-2.5">
                          <FiMapPin className="text-[#D4A373] shrink-0" />
                          <span className="text-sm text-gray-700 line-clamp-1 flex-1">
                            {location || "ไม่ระบุพิกัด"}
                          </span>
                        </div>

                        {isRehomeTab || isRequestTab ? (
                          <>
                            <InfoRow icon={HiOutlineTag} text={data?.type} />
                            <div className="flex items-center gap-2.5">
                              {data?.sex === "MALE" ? (
                                <>
                                  <FaMars className="text-blue-500 shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    เพศ: ผู้
                                  </span>
                                </>
                              ) : data?.sex === "FEMALE" ? (
                                <>
                                  <FaVenus className="text-pink-500 shrink-0" />
                                  <span className="text-sm text-gray-700">
                                    เพศ: เมีย
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
                            <InfoRow
                              icon={HiOutlineCalendar}
                              text={`อายุ: ${data?.age || "ไม่ระบุ"}`}
                            />
                            {/* สำหรับ Request Tab: data.reason คือเหตุผลหาบ้านของสัตว์ (ไม่ใช่เหตุผลแอดมิน) */}
                            <InfoRow
                              icon={MdOutlineQuestionAnswer}
                              text={`เหตุผล: ${data?.reason || "ไม่ระบุ"}`}
                            />
                            <InfoRow icon={HiOutlinePhone} text={data?.phone} />
                          </>
                        ) : (
                          // Found Tab (เหมือนเดิม)
                          !isRequestTab && (
                            <>
                              <InfoRow
                                icon={HiOutlineTag}
                                text={`ลักษณะ: ${item.description || "ไม่มีรายละเอียดเพิ่มเติม"}`}
                              />
                              <InfoRow
                                icon={MdPets}
                                text={`พฤติกรรม: ${getBehaviorLabel(item.behavior)}`}
                              />
                            </>
                          )
                        )}
                      </div>

                      {/* Footer Section: ให้ Request Tab โชว์ไอคอนวัคซีนด้วย */}
                      {isRehomeTab || isRequestTab ? (
                        <div className="px-4 pb-4 pt-2 mt-auto">
                          <div className="flex items-center justify-between gap-4 text-xs md:text-sm pt-3 border-t border-gray-100">
                            {/* เปลี่ยน item. เป็น data. */}
                            <StatusIcon
                              config={
                                healthStatusIcons[data?.vaccination_status]
                              }
                            />
                            <StatusIcon
                              config={
                                neuteredstatusIcons[data?.neutered_status]
                              }
                            />
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
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(id);
                        }}
                        className="bg-white/95 p-2.5 rounded-full shadow-lg hover:text-red-600 text-gray-500 active:scale-95 transition-all flex items-center justify-center"
                      >
                        <FaTrash size={16} />
                      </button>
                      <Link
                        href={
                          isRehomeTab
                            ? `/rehoming-report/edit/${id}`
                            : `/animal-report/edit/${id}`
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/95 p-2.5 rounded-full shadow-lg hover:text-blue-600 text-gray-500 flex items-center justify-center active:scale-95 transition-all"
                      >
                        <MdModeEdit size={18} />
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
