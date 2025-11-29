// HomePage.tsx

"use client";
import React, { useEffect, useState, useRef, JSX } from "react";
import Link from "next/link";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { FaMars, FaVenus, FaGenderless, FaTimesCircle } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FaHeart } from "react-icons/fa6";
import { FiMapPin } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { Mali } from "next/font/google";
import { useSession, signIn } from "next-auth/react";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

const getAnimalTypeLabel = (type: string) => {
  switch (type) {
    case "dog":
      return "สุนัข";
    case "cat":
      return "แมว";
    default:
      return "อื่นๆ";
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
const getMarkerIcon = (type: string) => {
  switch (type) {
    case "dog":
      return "/icons/pin-dog.png";
    case "cat":
      return "/icons/pin-cat.png";
    default:
      return "/icons/pin-other.png";
  }
};
const formatDateTime = (dateString: string) => {
  if (!dateString) return "ไม่ระบุเวลา";
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function HomePage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const { data: session, status } = useSession(); // <--- (คุณเรียกใช้ถูกแล้ว)
  const [animalPosts, setAnimalPosts] = useState<any[]>([]);
  const [rehomingPosts, setRehomingPosts] = useState<any[]>([]);

  const router = useRouter();
  const [stats, setStats] = useState({
    foundAnimals: 0,
    rehomingPosts: 0,
    urgentHelp: 0,
  });

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
      icon: <FaCircleCheck className="text-green-600" />,
    },
    NOT_VACCINATED: {
      label: "ยังไม่ได้ฉีดวัคซีน",
      icon: <FaTimesCircle className="text-red-600" />,
    },
  };
  const neuteredstatusIcons: Record<
    string,
    { label: string; icon: JSX.Element }
  > = {
    NEUTERED: {
      label: "ทำหมันแล้ว",
      icon: <FaCircleCheck className="text-green-600" />,
    },
    NOT_NEUTERED: {
      label: "ยังไม่ได้ทำหมัน",
      icon: <FaTimesCircle className="text-red-600" />,
    },
  };

  // โหลดชื่อผู้ใช้งานจาก localStorage
  useEffect(() => {
    const name = localStorage.getItem("userName");
    setUserName(name);
  }, []);

  // ปิดเมนูเมื่อคลิกนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // ฟังก์ชันสร้าง map (เรียกครั้งเดียว)
  const initMapOnce = () => {
    if (mapRef.current) return; // ถ้า map ถูกสร้างแล้ว ไม่ต้องทำซ้ำ
    const google = (window as any).google;
    if (!google) return;

    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 13.7563, lng: 100.5018 },
      zoom: 12,
    });
    mapRef.current = map;
  };

  // useEffect นี้จะคอย "รอ" ให้สคริปต์จาก layout โหลดเสร็จ
  useEffect(() => {
    // ฟังก์ชันนี้จะคอยเช็คว่า window.google พร้อมหรือยัง
    const checkGoogle = () => {
      if ((window as any).google && (window as any).google.maps) {
        // ถ้าพร้อมแล้ว -> สร้างแผนที่
        initMapOnce();
      } else {
        // ถ้ายังไม่พร้อม -> หน่วงเวลาแล้วเช็คใหม่
        setTimeout(checkGoogle, 100);
      }
    };

    checkGoogle(); // เริ่มเช็ค
  }, []);

 
  // useEffect สำหรับสร้าง "สะพาน" ให้ปุ่มใน InfoWindow
  useEffect(() => {
    // สร้างฟังก์ชันที่จะให้ปุ่มใน InfoWindow เรียกใช้
    (window as any).handleHelpAction = async (
      report_id: number,
      action_type: "FEED" | "ADOPT"
    ) => {
      // 1. ตรวจสอบว่าล็อกอินหรือยัง (ใช้ status จาก useSession)
      if (status === "unauthenticated") {
        alert("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
        signIn(undefined, { callbackUrl: "/" }); // ส่งไปหน้าล็อกอิน แล้วกลับมาหน้าหลัก
        return;
      }
      if (status === "loading") {
        alert("กำลังตรวจสอบข้อมูลผู้ใช้, กรุณาลองอีกครั้ง");
        return;
      }

      // 2. ยืนยันการกระทำ
      const message =
        action_type === "FEED"
          ? "ยืนยันว่าคุณได้ให้อาหารสัตว์ตัวนี้แล้ว?"
          : "คุณสนใจรับเลี้ยงสัตว์ตัวนี้ใช่ไหม? (ระบบจะแจ้งเตือนผู้โพสต์)";

      if (!confirm(message)) {
        return;
      }

      // 3. ส่งข้อมูลไปที่ API
      try {
        const res = await fetch("/api/help-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ report_id, action_type }),
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "เกิดข้อผิดพลาด");
        }

        alert("ขอบคุณสำหรับการช่วยเหลือ! (บันทึกข้อมูลสำเร็จ)");
      } catch (err: any) {
        console.error(err);
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      }
    };

    // Cleanup function เมื่อ component unmount
    return () => {
      (window as any).handleHelpAction = undefined;
    };
  }, [status, session]); 
  
  // ฟังก์ชันปักหมุด
  const addMarkers = () => {
    const google = (window as any).google;
    if (!google || !mapRef.current || !animalPosts) return;

    // ลบ marker เก่าก่อน
    if ((window as any).markers) {
      (window as any).markers.forEach((m: any) => m.setMap(null));
    }
    (window as any).markers = [];

    // วนลูป animalPosts เพื่อสร้างหมุด
    animalPosts.forEach((post) => {
      if (!post.latitude || !post.longitude) return;

      const iconUrl = getMarkerIcon(post.animal_type);

      const marker = new google.maps.Marker({
        position: {
          lat: parseFloat(post.latitude),
          lng: parseFloat(post.longitude),
        },
        map: mapRef.current,
        title: post.animal_type,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(53, 53),
          anchor: new google.maps.Point(20, 40),
        },
      });
      // --- สร้าง HTML Content สำหรับ InfoWindow ---
      const imageUrl =
        post.images?.length > 0
          ? post.images[0].image_url
          : "https://via.placeholder.com/300x200.png?text=No+Image";

      const location = post.location || "ไม่ระบุตำแหน่ง";
      const animalType = getAnimalTypeLabel(post.animal_type);
      const behavior = getBehaviorLabel(post.behavior);
      const dateTime = formatDateTime(post.created_at);
      const reporter = post.user?.name || "ไม่ระบุชื่อ";
      const description = post.description || "ไม่มีคำอธิบาย";
      // ประมวลผลข้อมูล "ผู้ช่วยเหลือ" ก่อน
      const feedActions = post.actions.filter(
        (a: any) => a.action_type === "FEED"
      );
      const adoptActions = post.actions.filter(
        (a: any) => a.action_type === "ADOPT"
      );
      let helpSummaryHtml = "";

      if (feedActions.length > 0) {
        // ดึงชื่อคนให้อาหาร (แบบไม่ซ้ำ)
        const feederNames = [
          ...new Set(feedActions.map((a: any) => a.user.name || "ผู้ใจดี")),
        ].join(", ");
        helpSummaryHtml += `<p style="margin: 4px 0; font-size: 0.85rem; color: #6D4C41;">🧡 <strong>คนให้อาหารแล้ว:</strong> ${feederNames}</p>`;
      }

      if (adoptActions.length > 0) {
        // ดึงชื่อคนสนใจรับเลี้ยง (แบบไม่ซ้ำ)
        const adopterNames = [
          ...new Set(adoptActions.map((a: any) => a.user.name || "ผู้ใจดี")),
        ].join(", ");
        helpSummaryHtml += `<p style="margin: 4px 0; font-size: 0.85rem; color: #4A5A2A;">💚 <strong>คนสนใจรับเลี้ยง:</strong> ${adopterNames}</p>`;
      }
      if (helpSummaryHtml === "") {
        helpSummaryHtml =
          '<p style="margin: 4px 0; font-size: 0.85rem; color: #777;"><i>ยังไม่มีคนให้ความช่วยเหลือ...</i></p>';
      }

      const contentString = `
        <div style="font-family: '${mali.style.fontFamily}', sans-serif; width: 420px; max-height: 500px; overflow-y: auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- รูปภาพ -->
          <div style="position: relative;">
            <img src="${imageUrl}" alt="${animalType}" style="width: 100%; height: 280px; object-fit: cover; border-radius: 12px 12px 0 0;">
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.95); padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; color: #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              ${animalType}
            </div>
          </div>

          <div style="padding: 16px;">
            
            <!-- สถานที่ -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 10px; background: #f8fafc; border-radius: 8px;">
              <span style="font-size: 1.3rem;">📍</span>
              <p style="font-weight: 600; margin: 0; font-size: 1rem; color: #1e293b;">${location}</p>
            </div>

            <!-- รายละเอียด -->
            <div style="font-size: 0.9rem; color: #475569; line-height: 1.7; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 0.85rem; color: #64748b; margin-top: 12px;">
                <span>${dateTime}</span>
                <span>${reporter}</span>
              </div> 
            <div style="margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 0.85rem;">ลักษณะ:</span>
                <p style="margin: 4px 0 0 0; color: #1e293b;">${description}</p>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 0.85rem;">พฤติกรรม:</span>
                <p style="margin: 4px 0 0 0; color: #1e293b;">${behavior}</p>
              </div>
            </div>

            <!-- ประวัติการช่วยเหลือ -->
            <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
              <p style="font-size: 0.85rem; font-weight: 600; color: #334155; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
               ผู้ช่วยเหลือ
              </p>
              ${helpSummaryHtml} 
            </div>
            
            <!-- ปุ่มช่วยเหลือ -->
            <p style="font-size: 0.95rem; font-weight: 700; color: #3a3a3a; margin: 0 0 12px 0;">ฉันต้องการช่วยเหลือ:</p>
            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
              <button onclick="handleHelpAction(${post.report_id}, 'FEED')" 
                style="flex: 1; padding: 12px 18px; background: #D4A373; border: none; border-radius: 15px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 3px 8px rgba(0,0,0,0.1);"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" 
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.1)'">
                ฉันจะเอาอาหารไปให้
              </button>
              
              <button onclick="handleHelpAction(${post.report_id}, 'ADOPT')" 
                style="flex: 1; padding: 12px 18px; background: #F9FAE0; border: none; border-radius: 15px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 3px 8px rgba(0,0,0,0.1);"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" 
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.1)'">
                ฉันสนใจรับเลี้ยง
              </button>
            </div>

            <!-- ลิงก์รายละเอียด -->
            <a href="/animal-report/${post.report_id}" target="_blank" 
              style="display: block; text-align: center; padding: 10px; background: #E9EDC9; text-decoration: none; border-radius: 8px; font-size: 0.9rem; font-weight: 500; transition: background 0.2s;"
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" 
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.1)'">
              ติดต่อผู้แจ้ง
            </a>
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: contentString,
      });

      marker.addListener("click", () =>
        infoWindow.open(mapRef.current, marker)
      );

      (window as any).markers.push(marker);
    });
  };

  // รี-วาด map ทุกครั้ง animalPosts เปลี่ยน
  useEffect(() => {
    // รอให้ map พร้อม และ animalPosts มีข้อมูล
    if (mapRef.current && animalPosts.length > 0) {
      addMarkers();
    }
  }, [animalPosts, mapRef.current]); // <-- ให้ re-run เมื่อ map พร้อม

  // โหลด animal-report สำหรับ map
  useEffect(() => {
    async function fetchAnimalPosts() {
      try {
        const res = await fetch("/api/animal-report", { cache: "no-store" });
        const data = await res.json();
        setAnimalPosts(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchAnimalPosts();
  }, []);

  // โหลด rehoming-report สำหรับ Latest Posts
  useEffect(() => {
    async function fetchRehomingPosts() {
      try {
        const res = await fetch("/api/rehoming-report", { cache: "no-store" });
        const data = await res.json();
        // เรียงตามวันที่ล่าสุด
        const sorted = data.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRehomingPosts(sorted.slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    }
    fetchRehomingPosts();
  }, []);

  // โหลด stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const [rehomingRes, animalReportRes, helpActionRes] = await Promise.all(
          [
            fetch("/api/rehoming-report", { cache: "no-store" }),
            fetch("/api/animal-report", { cache: "no-store" }),
            fetch("/api/help-action", { cache: "no-store" }),
          ]
        );

        // 2. [แก้ไข] ตรวจสอบ .ok ให้ครบทั้ง 3 อัน
        if (!rehomingRes.ok || !animalReportRes.ok || !helpActionRes.ok) {
          console.error("Failed to fetch one or more stats endpoints");
          return;
        }

        const rehomingData = await rehomingRes.json();
        const animalReportData = await animalReportRes.json();
        const helpActionData = await helpActionRes.json();

        // 3. คำนวณ Stats จากข้อมูลที่ถูกต้อง
        const rehomingPostsCount = rehomingData.length;
        const foundAnimalsCount = animalReportData.length;
        const totalHelpActions = helpActionData.length;

        // 5. อัปเดต State
        setStats({
          rehomingPosts: rehomingPostsCount,
          foundAnimals: foundAnimalsCount,
          urgentHelp: totalHelpActions,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
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
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center py-6 px-4">
        {[
          ["ประกาศหาบ้าน", stats.rehomingPosts, "text-purple-600"],
          ["สัตว์ไร้บ้านที่พบ", stats.foundAnimals, "text-[#D4A373]"],
          ["คนช่วยเหลือ", stats.urgentHelp, "text-green-600"],
        ].map(([label, count, color], i) => (
          <div key={i}>
            <p className={`text-3xl font-bold ${color}`}>{count}</p>
            <p className={color as string}>{label}</p>
          </div>
        ))}
      </section>

      {/* Map Section */}
      <section className="px-4 py-8">
        <div className="flex items-center justify-between mb-2 py-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
              <FiMapPin size={35} style={{ color: "#ff0000" }} />
            </span>
            <h2 className="font-semibold text-xl pl-16">แผนที่สัตว์ไร้บ้าน</h2>
          </div>
        </div>
        <div
          id="map"
          className="w-full h-[800px] rounded overflow-hidden border"
        />
      </section>

      {/* Latest Posts Section */}
      <section className="px-4 py-8">
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
            <FaHeart size={35} style={{ color: "#ff0000" }} />
          </span>
          <h2 className="font-semibold text-xl mb-4 pl-16">
            ประกาศหาบ้านล่าสุด
          </h2>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rehomingPosts.map((post) => (
              <Link
                key={post.post_id}
                href={`/rehoming-report/${post.post_id}`}
                className="w-full max-w-sm rounded-2xl p-4 shadow hover:shadow-lg transition cursor-pointer flex flex-col bg-white"
              >
                {post.images?.length > 0 ? (
                  <img
                    src={post.images[0].image_url}
                    alt={post.pet_name}
                    className="w-full aspect-[4/3] object-cover mb-2 rounded-xl"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-xl">
                    <span className="text-gray-500">ไม่มีรูปภาพ</span>
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
                      <MdOutlineQuestionAnswer className="text-[#D4A373]" />{" "}
                      เหตุผล: {post.reason}
                    </p>
                    <p className="flex items-center gap-2">
                      <HiOutlinePhone className="text-[#D4A373]" /> {post.phone}
                    </p>
                  </div>
                </div>
              </Link>
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
