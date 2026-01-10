// HomePage.tsx
"use client";
import React, { useEffect, useState, useRef, JSX } from "react";
import Link from "next/link";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
  HiSearch,
} from "react-icons/hi";
import {
  FaMars,
  FaVenus,
  FaGenderless,
  FaTimesCircle,
  FaSearchLocation,
} from "react-icons/fa";
import { FaCircleCheck, FaHeart } from "react-icons/fa6";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import { Home, PawPrint, Heart } from "lucide-react";
import { BiTargetLock } from "react-icons/bi";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { Mali } from "next/font/google";
import { useSession, signIn } from "next-auth/react";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

// --- Helper Functions ---
// สูตรคำนวณระยะทาง (Haversine Formula) สำหรับ Smart Search
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

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

  // Map Refs
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]); // ใช้ useRef แทน window.markers

  const { data: session, status } = useSession();

  // State สำหรับ Data
  const [allAnimalPosts, setAllAnimalPosts] = useState<any[]>([]); // เก็บข้อมูล Master
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]); // เก็บข้อมูลที่ผ่านการกรอง/ค้นหา
  const [rehomingPosts, setRehomingPosts] = useState<any[]>([]);

  // State สำหรับ Smart Search
  const [searchCriteria, setSearchCriteria] = useState({
    type: "all",
    keyword: "",
    behavior: "all",
    onlyActive: true,
    userLat: 13.7563, // Default Bangkok
    userLng: 100.5018,
  });
  const [isSmartSearchActive, setIsSmartSearchActive] = useState(false);

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

  // const statsIcons: Record<
  //   string,
  //   { label: string; icon: JSX.Element }
  // > = {
  //   foundAnimals: {
  //     label: "ประกาศหาบ้าน",
  //     icon: <RiHomeHeartFill size={22} style={{ color: "green" }} />,
  //   },
  //   rehomingPosts: {
  //     label: "สัตว์ไร้บ้านที่พบ",
  //     icon: <FaTimesCircle size={22} style={{ color: "red" }} />,
  //   },
  //   urgentHelp: {
  //     label: "คนช่วยเหลือ",
  //     icon: <FaTimesCircle size={22} style={{ color: "red" }} />,
  //   },
  // };

  // Mapping สถานะต่างๆ
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

  // โหลดชื่อผู้ใช้งานจาก localStorage
  useEffect(() => {
    const name = localStorage.getItem("userName");
    setUserName(name);

    // Smart Feature: ขอพิกัดผู้ใช้ทันทีที่เข้าเว็บ
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setSearchCriteria((prev) => ({
          ...prev,
          userLat: position.coords.latitude,
          userLng: position.coords.longitude,
        }));
      });
    }
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

  // --- Map Initialization ---
  const initMapOnce = () => {
    if (mapRef.current) return;
    const google = (window as any).google;
    if (!google) return;

    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 13.7563, lng: 100.5018 },
      zoom: 12,
    });
    mapRef.current = map;
  };

  useEffect(() => {
    const checkGoogle = () => {
      if ((window as any).google && (window as any).google.maps) {
        initMapOnce();
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    checkGoogle();
  }, []);

  //Handle Help Action
  useEffect(() => {
    (window as any).handleHelpAction = async (
      report_id: number,
      action_type: "FEED" | "ADOPT"
    ) => {
      if (status === "unauthenticated") {
        alert("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
        signIn(undefined, { callbackUrl: "/" });
        return;
      }
      if (status === "loading") {
        alert("กำลังตรวจสอบข้อมูลผู้ใช้, กรุณาลองอีกครั้ง");
        return;
      }

      const message =
        action_type === "FEED"
          ? "ยืนยันว่าคุณได้ให้อาหารสัตว์ตัวนี้แล้ว?"
          : "คุณสนใจรับเลี้ยงสัตว์ตัวนี้ใช่ไหม? (ระบบจะแจ้งเตือนผู้โพสต์)";

      if (!confirm(message)) return;

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
        window.location.reload();
      } catch (err: any) {
        console.error(err);
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      }
    };

    return () => {
      (window as any).handleHelpAction = undefined;
    };
  }, [status, session]);

  // --- Add Markers Logic (Updated for Smart Search) ---
  const addMarkers = () => {
    const google = (window as any).google;
    if (!google || !mapRef.current || !filteredPosts) return; // ใช้ filteredPosts แทน

    // 1. ลบ Marker เก่า โดยใช้ markersRef
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    }

    // 2. วนลูปสร้าง Marker ใหม่
    filteredPosts.forEach((post) => {
      if (!post.latitude || !post.longitude) return;

      const iconUrl = getMarkerIcon(post.animal_type);

      // Smart Logic: เช็คคะแนนเพื่อปรับขนาดหมุด
      const matchScore = post.matchScore || 0;
      const isHighMatch = isSmartSearchActive && matchScore > 70;

      const marker = new google.maps.Marker({
        position: {
          lat: parseFloat(post.latitude),
          lng: parseFloat(post.longitude),
        },
        map: mapRef.current,
        title: post.animal_type,
        icon: {
          url: iconUrl,
          // ถ้าคะแนนสูง ให้หมุดใหญ่ขึ้น
          scaledSize: new google.maps.Size(
            isHighMatch ? 65 : 53,
            isHighMatch ? 65 : 53
          ),
          anchor: new google.maps.Point(26.5, 53),
        },
        // ถ้าคะแนนสูง ให้หมุดเด้งดึ๋ง
        animation: isHighMatch ? google.maps.Animation.BOUNCE : null,
      });

      // HTML Content
      const imageUrl =
        post.images?.length > 0
          ? post.images[0].image_url
          : "https://via.placeholder.com/300x200.png?text=No+Image";

      const location = post.location || "ไม่ระบุตำแหน่ง";
      const getAnimalTypeLabel = (type: string | number) => {
        // 1. กำหนดค่ามาตรฐาน
        const typeMap: Record<string, string> = {
          dog: "สุนัข",
          cat: "แมว",
          other: "อื่นๆ", // เผื่อกรณีข้อมูลเก่าหลุดมา
        };

        // 2. คืนค่าตาม Logic:
        // - ถ้า type ตรงกับ key ใน map (เช่น 'dog') -> คืนค่า 'สุนัข'
        // - ถ้าไม่ตรง (เช่น 'กระต่าย' ที่ user พิมพ์มาเอง) -> คืนค่า 'กระต่าย' กลับไปเลย
        return typeMap[String(type)] || type;
      };
      const behavior = getBehaviorLabel(post.behavior);
      const dateTime = formatDateTime(post.created_at);
      const reporter = post.user?.name || "ไม่ระบุชื่อ";
      const description = post.description || "ไม่มีคำอธิบาย";

      // Smart Logic: Badge คะแนน
      let scoreBadge = "";
      if (isSmartSearchActive) {
        scoreBadge = `
            <div style="background: ${
              matchScore > 70 ? "#4ADE80" : "#FACC15"
            }; color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; margin-bottom: 8px; display: inline-block;">
               ตรงกับที่คุณหา ${matchScore}%
            </div>
         `;
      }

      const feedActions = post.actions.filter(
        (a: any) => a.action_type === "FEED"
      );
      const adoptActions = post.actions.filter(
        (a: any) => a.action_type === "ADOPT"
      );

      let helpSummaryHtml = "";
      if (feedActions.length > 0) {
        const feederNames = [
          ...new Set(feedActions.map((a: any) => a.user.name || "ผู้ใจดี")),
        ].join(", ");
        helpSummaryHtml += `<p style="margin: 4px 0; font-size: 0.85rem; color: #6D4C41;">🧡 <strong>คนให้อาหารแล้ว:</strong> ${feederNames}</p>`;
      }
      if (adoptActions.length > 0) {
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
        <div style="font-family: '${
          mali.style.fontFamily
        }', sans-serif; width: 320px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
          
          <div style="position: relative; height: 200px;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(to top, rgba(0,0,0,0.2), transparent); pointer-events: none;"></div>

            ${
              scoreBadge
                ? `<div style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 10; width: 90%; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  ${scoreBadge}
               </div>`
                : ""
            }
            
            <div style="position: absolute; top: 12px; left: 12px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
               <div style="width: 6px; height: 6px; border-radius: 50%; background: ${
                 post.status === "STILL_THERE"
                   ? "#EF4444"
                   : post.status === "MOVED"
                   ? "#F59E0B"
                   : "#10B981"
               };"></div>
               <span style="font-size: 0.75rem; font-weight: 600; color: white;">${
                 post.status === "STILL_THERE"
                   ? "ยังอยู่ที่เดิม"
                   : post.status === "MOVED"
                   ? "ย้ายที่แล้ว / หาไม่เจอ"
                   : "ช่วยเหลือแล้ว"
               }</span>
            </div>

            <span style="position: absolute; bottom: 12px; right: 12px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; color: #D4A373; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${getAnimalTypeLabel(post.animal_type)}
            </span>
          </div>
          
          <div style="padding: 16px;">
            
            <div style="margin-bottom: 12px;">
              <h3 style="margin: 0 0 4px 0; font-size: 1.1rem; color: #111827; font-weight: 700; line-height: 1.4;">
                พบที่ ${location}
              </h3>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #6B7280;">
                 <span style="display: flex; align-items: center; gap: 4px;">
                    ${dateTime}
                 </span>
                 <span>
                    โดย ${reporter}
                 </span>
              </div>
            </div>
            
            <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
              <div style="margin-bottom: 8px;">
                <span style="font-size: 0.75rem; color: #9CA3AF; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">ลักษณะ</span>
                <p style="margin: 2px 0 0 0; font-size: 0.9rem; color: #374151; line-height: 1.4;">${description}</p>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: #9CA3AF; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">พฤติกรรม</span>
                <p style="margin: 2px 0 0 0; font-size: 0.9rem; color: #374151; line-height: 1.4;">${behavior}</p>
              </div>
            </div>

            ${
              helpSummaryHtml
                ? `
            <div style="background: #ECFDF5; border: 1px solid #D1FAE5; padding: 10px; border-radius: 10px; margin-bottom: 16px; font-size: 0.8rem;">
              ${helpSummaryHtml}
            </div>`
                : ""
            }
            
            <div style="display: flex; gap: 8px;">
              <button onclick="handleHelpAction(${post.report_id}, 'FEED')" 
                style="flex: 1; padding: 10px 0; background: #FFF7ED; color: #C2410C; border: 1px solid #FFEDD5; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: all 0.2s;"
                onmouseover="this.style.background='#FFEDD5';" 
                onmouseout="this.style.background='#FFF7ED';">
                ให้อาหาร
              </button>
              <button onclick="handleHelpAction(${post.report_id}, 'ADOPT')" 
                style="flex: 1; padding: 10px 0; background: #D4A373; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(212, 163, 115, 0.4); transition: all 0.2s;"
                onmouseover="this.style.background='#B88D63'; this.style.transform='translateY(-1px)';" 
                onmouseout="this.style.background='#D4A373'; this.style.transform='translateY(0)';">
                รับเลี้ยง
              </button>
            </div>
            
          </div>
        </div>
      `;
      const infoWindow = new google.maps.InfoWindow({ content: contentString });
      marker.addListener("click", () =>
        infoWindow.open(mapRef.current, marker)
      );

      markersRef.current.push(marker);
    });

    // Auto Zoom ไปหาจุดที่เจอผลลัพธ์
    if (isSmartSearchActive && filteredPosts.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      filteredPosts.forEach((post) => {
        if (post.latitude && post.longitude) {
          bounds.extend({
            lat: parseFloat(post.latitude),
            lng: parseFloat(post.longitude),
          });
        }
      });
      mapRef.current.fitBounds(bounds);
    }
  };

  // Re-run addMarkers when filteredPosts updates
  useEffect(() => {
    if (mapRef.current && filteredPosts.length > 0) {
      addMarkers();
    }
  }, [filteredPosts]);

  // --- Handle Smart Search Logic (Upgraded) ---
  const handleSmartSearch = () => {
    if (!allAnimalPosts.length) return;
    setIsSmartSearchActive(true);

    const scoredPosts = allAnimalPosts.map((post) => {
      // --- กรองเบื้องต้น (Hard Filter) ---
      // ถ้าเลือก "เฉพาะที่ยังอยู่" แล้วโพสต์สถานะไม่ใช่ STILL_THERE -> ตัดทิ้งเลย
      if (searchCriteria.onlyActive && post.status !== "STILL_THERE") {
        return { ...post, matchScore: 0 };
      }

      // ถ้าเลือก "พฤติกรรม" เจาะจง แล้วไม่ตรง -> ตัดทิ้งเลย
      if (
        searchCriteria.behavior !== "all" &&
        post.behavior !== searchCriteria.behavior
      ) {
        return { ...post, matchScore: 0 };
      }

      let score = 0;

      // 1. คะแนนประเภท (30)
      if (
        searchCriteria.type === "all" ||
        post.animal_type === searchCriteria.type
      ) {
        score += 30;
      } else {
        return { ...post, matchScore: 0 };
      }

      // 2. คะแนนระยะทาง (Max 40)
      if (post.latitude && post.longitude) {
        const dist = getDistanceFromLatLonInKm(
          searchCriteria.userLat,
          searchCriteria.userLng,
          parseFloat(post.latitude),
          parseFloat(post.longitude)
        );
        if (dist < 2) score += 40;
        else if (dist < 5) score += 30;
        else if (dist < 10) score += 20;
        else score += 5;
      }

      // 3. คะแนนคีย์เวิร์ด (Max 30)
      if (searchCriteria.keyword && post.description) {
        const keywords = searchCriteria.keyword.split(" ");
        let hit = 0;
        keywords.forEach((word) => {
          if (post.description.includes(word)) hit++;
        });
        if (hit > 0) score += 30;
      }

      return { ...post, matchScore: Math.min(score, 100) };
    });

    const results = scoredPosts
      .filter((p) => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    setFilteredPosts(results);

    // Auto Zoom
    if (results.length > 0 && results[0].latitude && mapRef.current) {
      mapRef.current.panTo({
        lat: parseFloat(results[0].latitude),
        lng: parseFloat(results[0].longitude),
      });
      mapRef.current.setZoom(14);
    }
  };

  const handleReset = () => {
    setFilteredPosts(allAnimalPosts);
    setIsSmartSearchActive(false);
    setSearchCriteria((prev) => ({
      ...prev,
      keyword: "",
      type: "all",
      behavior: "all",
      onlyActive: true,
    }));
  };

  // Fetch Animal Posts
  useEffect(() => {
    async function fetchAnimalPosts() {
      try {
        const res = await fetch("/api/animal-report", { cache: "no-store" });
        const data = await res.json();
        setAllAnimalPosts(data); // เก็บ Master
        setFilteredPosts(data); // เริ่มต้นโชว์ทั้งหมด
      } catch (err) {
        console.error(err);
      }
    }
    fetchAnimalPosts();
  }, []);

  // Fetch Rehoming & Stats
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Latest Rehoming
        const resRehome = await fetch("/api/rehoming-report", {
          cache: "no-store",
        });
        if (resRehome.ok) {
          const data = await resRehome.json();
          const sorted = data.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setRehomingPosts(sorted.slice(0, 4));
        }

        // Fetch Stats
        const [rehomingRes, animalReportRes, helpActionRes] = await Promise.all(
          [
            fetch("/api/rehoming-report", { cache: "no-store" }),
            fetch("/api/animal-report", { cache: "no-store" }),
            fetch("/api/help-action", { cache: "no-store" }),
          ]
        );

        if (rehomingRes.ok && animalReportRes.ok && helpActionRes.ok) {
          const rData = await rehomingRes.json();
          const aData = await animalReportRes.json();
          const hData = await helpActionRes.json();
          setStats({
            rehomingPosts: rData.length,
            foundAnimals: aData.length,
            urgentHelp: hData.length,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className={`min-h-screen bg-white text-gray-800 ${mali.className}`}>
      <Header />

      <div className="w-full">
        {/* Row 1: ข้อความ (ซ้าย) - รูปภาพ (ขวา) */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] relative">
          {/* Text Area */}
          <div className="flex flex-col justify-center items-center p-8 md:p-1 order-2 md:order-1 relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-[#FEFAE0] bg-opacity-10 px-4 py-2 rounded-full mb-6">
                <span className="text-sm">แจ้งพบสัตว์</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                ช่วยเหลือสัตว์ไร้บ้าน
              </h2>

              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
                หากคุณพบสัตว์ที่ถูกทอดทิ้ง เจ็บป่วย หรือไม่มีที่อยู่อาศัย
                การแจ้งข้อมูลของคุณจะช่วยให้ผู้อื่นสามารถเข้ามาดูแล ให้อาหาร
                หรือประสานการช่วยเหลือได้ตรงจุด
                <br className="hidden md:block" /> เพราะทุกการแจ้ง
                คือโอกาสใหม่ของหนึ่งชีวิต
              </p>

              <button
                onClick={() => router.push("/animal-report")}
                className="animate-bounce group relative bg-linear-to-r from-[#D4A373] to-[#c49261] hover:from-[#c49261] hover:to-[#b58350] text-white font-semibold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3"
              >
                <span className="relative z-10">
                  แจ้งพบสัตว์ไร้บ้าน ได้ที่นี่
                </span>
                <svg
                  className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div className="h-80 md:h-auto relative order-1 md:order-2 overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-[#D4A373] to-transparent opacity-20 z-10 group-hover:opacity-30 transition-opacity duration-500"></div>
            <img
              src="/Cat2.jpg"
              alt="Stray Cat"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black to-transparent opacity-40 z-10"></div>
          </div>
        </div>

        {/* Row 2: รูปภาพ (ซ้าย) - ข้อความ (ขวา) */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] relative">
          {/* Image Area */}
          <div className="h-80 md:h-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-bl from-[#D4A373] to-transparent opacity-20 z-10 group-hover:opacity-30 transition-opacity duration-500"></div>
            <img
              src="/Dog.png"
              alt="Smiling Dog"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black to-transparent opacity-40 z-10"></div>
          </div>

          {/* Text Area */}
          <div className="flex flex-col justify-center items-center p-8 md:p-16 relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-[#FEFAE0] bg-opacity-10 px-4 py-2 rounded-full mb-6">
                <span className="text-sm">หาบ้านใหม่</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                มอบบ้านใหม่ที่อบอุ่น
              </h2>

              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
                เมื่อไม่สามารถดูแลเขาได้เหมือนเดิม การหาบ้านใหม่ที่อบอุ่น
                อาจเป็นทางเลือกที่ดีที่สุด สำหรับสัตว์เลี้ยงที่คุณรัก
                <br className="hidden md:block" />{" "}
                เราขอช่วยเป็นสะพานให้เขาได้พบกับเจ้าของคนใหม่
              </p>

              <button
                onClick={() => router.push("/form-rehoming")}
                className="animate-bounce group relative bg-linear-to-r from-[#D4A373] to-[#c49261] hover:from-[#c49261] hover:to-[#b58350] text-white font-semibold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3"
              >
                <span className="relative z-10">หาบ้านให้น้อง ได้ที่นี่</span>
                <svg
                  className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Statistics Section --- */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center py-14 px-4">
        {[
          {
            label: "ประกาศหาบ้าน",
            count: stats.rehomingPosts,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            IconComponent: Home,
          },
          {
            label: "สัตว์ไร้บ้านที่พบ",
            count: stats.foundAnimals,
            color: "text-[#D4A373]",
            bgColor: "bg-orange-100",
            IconComponent: PawPrint,
          },
          {
            label: "คนช่วยเหลือ",
            count: stats.urgentHelp,
            color: "text-green-600",
            bgColor: "bg-green-100",
            IconComponent: Heart,
          },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* ส่วนแสดงไอคอน */}
            <div
              className={`${item.bgColor} ${item.color} w-14 h-14 rounded-full flex items-center justify-center mb-4`}
            >
              {/* เรียกใช้ Icon ในรูปแบบ Component */}
              <item.IconComponent className="w-7 h-7" strokeWidth={2} />
            </div>

            <p className={`text-3xl font-bold ${item.color} mb-1`}>
              {item.count}
            </p>
            <p className="text-gray-600 font-medium">{item.label}</p>
          </div>
        ))}
      </section>

      {/* --- NEW: Smart Search Section --- */}
      <section className="px-4 pt-6 pb-2">
        <div className="p-6 text-black">
          <div className="flex items-center gap-3 mb-5">
            <FaSearchLocation className="text-black text-xl" />
            <div>
              <h2 className="text-xl font-bold ">
                ค้นหาสัตว์เลี้ยง / กรองสัตว์ในพื้นที่
              </h2>
            </div>
          </div>

          {/* แถวที่ 1: ประเภท + พฤติกรรม */}
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <select
              className="flex-1 rounded-xl border border-gray-300 hover:border-[#D4A373] px-4 py-3 text-gray-800 outline-none"
              value={searchCriteria.type}
              onChange={(e) =>
                setSearchCriteria({ ...searchCriteria, type: e.target.value })
              }
            >
              <option value="all">ทุกประเภท</option>
              <option value="dog">สุนัข</option>
              <option value="cat">แมว</option>
              <option value="other">อื่นๆ</option>
            </select>

            <select
              className="flex-1 rounded-xl px-4 py-3 text-gray-800 outline-none border border-gray-300 hover:border-[#D4A373]"
              value={searchCriteria.behavior}
              onChange={(e) =>
                setSearchCriteria({
                  ...searchCriteria,
                  behavior: e.target.value,
                })
              }
            >
              <option value="all">พฤติกรรม (ทั้งหมด)</option>
              <option value="friendly">เชื่อง เข้าหาคนได้</option>
              <option value="injured">บาดเจ็บ ต้องการความช่วยเหลือ</option>
              <option value="aggressive">ดุร้าย หลบหนี</option>
            </select>
          </div>

          {/* แถวที่ 2: คีย์เวิร์ด + ปุ่มค้นหา */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-2 relative">
              <input
                type="text"
                placeholder="ระบุลักษณะ (เช่น สีขาว, ปลอกคอ...)"
                className="w-full rounded-xl px-4 py-3 pl-10 text-gray-800 outline-none border border-gray-300 hover:border-[#D4A373]"
                value={searchCriteria.keyword}
                onChange={(e) =>
                  setSearchCriteria({
                    ...searchCriteria,
                    keyword: e.target.value,
                  })
                }
              />
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </div>

            <button
              onClick={handleSmartSearch}
              className="bg-white text-[#D4A373] font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <BiTargetLock /> ค้นหา
            </button>
            {isSmartSearchActive && (
              <button
                onClick={handleReset}
                className="bg-white text-black px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                ล้างค่า
              </button>
            )}
          </div>

          {/* แถวที่ 3: Checkbox ตัวเลือกเสริม */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="activeOnly"
              className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
              checked={searchCriteria.onlyActive}
              onChange={(e) =>
                setSearchCriteria({
                  ...searchCriteria,
                  onlyActive: e.target.checked,
                })
              }
            />
            <label
              htmlFor="activeOnly"
              className="text-sm font-medium cursor-pointer select-none"
            >
              แสดงเฉพาะตัวที่ยังอยู่ (ยังไม่มีคนช่วย)
            </label>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <FiMapPin size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-800">
                {isSmartSearchActive
                  ? `ผลการค้นหา (${filteredPosts.length} รายการ)`
                  : "พิกัดสัตว์ไร้บ้าน"}
              </h2>
              {isSmartSearchActive && (
                <p className="text-sm text-[#D4A373] font-bold">
                  เรียงตามความเหมือนและระยะทาง
                </p>
              )}
            </div>
          </div>
        </div>
        {/* ปรับความสูง Map ให้ Responsive */}
        <div
          id="map"
          className="w-full h-[50vh] md:h-[600px] lg:h-[700px] rounded-2xl overflow-hidden shadow-lg border-2 border-orange-100"
        />
      </section>

      {/* Latest Posts Section */}
      <section className="px-4 py-8 bg-linear-to-b from-white to-orange-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-pink-100 p-2 rounded-full">
            <FaHeart size={24} className="text-pink-500" />
          </div>
          <h2 className="font-bold text-xl text-gray-800">
            ประกาศหาบ้านล่าสุด
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {rehomingPosts.map((post) => (
            <Link
              key={post.post_id}
              href={`/rehoming-report/${post.post_id}`}
              className="group bg-white rounded-2xl p-3 shadow-md hover:shadow-xl transition-all duration-300 border border-transparent hover:border-orange-200"
            >
              <div className="relative overflow-hidden rounded-xl mb-3">
                <div className="absolute top-3 right-3 z-10">
                  {post.status === "ADOPTED" ? (
                    <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                      <FaCircleCheck className="text-white" /> ได้บ้านแล้ว
                    </span>
                  ) : (
                    <span className="bg-[#D4A373]/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                      หาบ้านอยู่
                    </span>
                  )}
                </div>
                {post.images?.length > 0 ? (
                  <img
                    src={post.images[0].image_url}
                    alt={post.pet_name}
                    className={`w-full aspect-4/3 object-cover transition-transform duration-500 group-hover:scale-110 ${
                      post.status === "ADOPTED"
                        ? "grayscale opacity-80"
                        : "group-hover:scale-105"
                    }`}
                  />
                ) : (
                  <div className="w-full aspect-4/3 bg-gray-100 flex items-center justify-center text-gray-400">
                    ไม่มีรูปภาพ
                  </div>
                )}

                {post.status === "ADOPTED" && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center"></div>
                )}
              </div>

              <div className="px-2 pb-2">
                <h2 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-[#D4A373] transition-colors">
                  {post.pet_name}
                </h2>

                <div className="text-sm text-gray-500 space-y-1.5">
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
                    <HiOutlineCalendar className="text-[#D4A373] shrink-0" />
                    <span className="truncate">
                      อายุ: {post.age || "ไม่ระบุ"}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <MdOutlineQuestionAnswer className="text-[#D4A373] shrink-0" />
                    <span className="truncate">
                      เหตุผล: {post.reason || "ไม่ระบุ"}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <HiOutlinePhone className="text-[#D4A373] shrink-0" />
                    <span className="truncate">{post.phone || "ไม่ระบุ"}</span>
                  </p>

                  <p className="flex items-center gap-2">
                    <FiMapPin className="text-red-500 shrink-0" />
                    <span className="truncate">
                      {post.address || "ไม่ระบุ"}
                    </span>
                  </p>

                  {/* Footer */}
                  <div className="px-4 pb-4 pt-2 mt-auto">
                    <div className="flex items-center justify-between gap-4 text-xs md:text-sm pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <span className="shrink-0">
                          {healthStatusIcons[post.vaccination_status]?.icon}
                        </span>
                        <span className="truncate">
                          {healthStatusIcons[post.vaccination_status]?.label ||
                            "ไม่ระบุ"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <span className="shrink-0">
                          {neuteredstatusIcons[post.neutered_status]?.icon}
                        </span>
                        <span className="truncate">
                          {neuteredstatusIcons[post.neutered_status]?.label ||
                            "ไม่ระบุ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/rehoming-report")}
            className="px-6 py-2 bg-white border-2 border-[#D4A373] text-[#D4A373] rounded-full font-bold hover:bg-[#D4A373] hover:text-white transition-all shadow-sm"
          >
            ดูประกาศทั้งหมด →
          </button>
        </div>
      </section>
    </div>
  );
}
