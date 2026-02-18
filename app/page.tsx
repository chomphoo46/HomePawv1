"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { HiOutlineCalendar, HiOutlinePhone, HiSearch } from "react-icons/hi";
import { FaMars, FaVenus, FaGenderless, FaTimesCircle, FaSearchLocation } from "react-icons/fa";
import { FaCircleCheck, FaHeart } from "react-icons/fa6";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import { Home, PawPrint, Heart } from "lucide-react";
import { BiTargetLock } from "react-icons/bi";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { Mali } from "next/font/google";
import { useSession, signIn } from "next-auth/react";
import PetCard from "./components/PetCard";

const MapComponent = dynamic(() => import("@/app/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">กำลังโหลดแผนที่...</div>
});

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

// --- Helper Functions ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const getBehaviorLabel = (behavior: string) => {
  switch (behavior) {
    case "friendly": return "เชื่อง เข้าหาคนได้";
    case "aggressive": return "ดุร้าย";
    case "injured": return "บาดเจ็บ ต้องการความช่วยเหลือ";
    default: return "อื่นๆ";
  }
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "ไม่ระบุเวลา";
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // States
  const [allAnimalPosts, setAllAnimalPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [rehomingPosts, setRehomingPosts] = useState<any[]>([]);
  const [searchCriteria, setSearchCriteria] = useState({
    type: "all", keyword: "", behavior: "all", onlyActive: true,
    userLat: 13.7563, userLng: 100.5018,
  });
  const [isSmartSearchActive, setIsSmartSearchActive] = useState(false);
  const [mapView, setMapView] = useState({ center: [13.7563, 100.5018] as [number, number], zoom: 12 });
  const [stats, setStats] = useState({ foundAnimals: 0, rehomingPosts: 0, urgentHelp: 0 });

  const getSexLabel = (sex: string) => {
    switch (sex) {
      case "MALE": return "เพศ: ผู้";
      case "FEMALE": return "เพศ: เมีย";
      default: return "ไม่ระบุ";
    }
  };

  const healthStatusIcons: Record<string, { label: string; icon: any }> = {
    VACCINATED: { label: "ฉีดวัคซีนแล้ว", icon: <FaCircleCheck size={22} style={{ color: "green" }} /> },
    NOT_VACCINATED: { label: "ยังไม่ได้ฉีดวัคซีน", icon: <FaTimesCircle size={22} style={{ color: "red" }} /> },
  };

  const neuteredstatusIcons: Record<string, { label: string; icon: any }> = {
    NEUTERED: { label: "ทำหมันแล้ว", icon: <FaCircleCheck size={22} style={{ color: "green" }} /> },
    NOT_NEUTERED: { label: "ยังไม่ได้ทำหมัน", icon: <FaTimesCircle size={22} style={{ color: "red" }} /> },
  };

  // 1. Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setSearchCriteria(prev => ({ ...prev, userLat: coords[0], userLng: coords[1] }));
        setMapView({ center: coords, zoom: 14 });
      });
    }
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    async function fetchData() {
      try {
        const [animalRes, rehomeRes, helpRes] = await Promise.all([
          fetch("/api/animal-report", { cache: "no-store" }),
          fetch("/api/rehoming-report", { cache: "no-store" }),
          fetch("/api/help-action", { cache: "no-store" })
        ]);
        if (animalRes.ok && rehomeRes.ok && helpRes.ok) {
          const aData = await animalRes.json();
          const rData = await rehomeRes.json();
          const hData = await helpRes.json();
          setAllAnimalPosts(aData);
          setFilteredPosts(aData);
          setRehomingPosts(rData.slice(0, 4));
          setStats({ foundAnimals: aData.length, rehomingPosts: rData.length, urgentHelp: hData.length });
        }
      } catch (err) { console.error(err); }
    }
    fetchData();
  }, []);

  // 3. Smart Search Logic
  const handleSmartSearch = () => {
    if (!allAnimalPosts.length) return;
    setIsSmartSearchActive(true);

    const scoredPosts = allAnimalPosts.map((post) => {
      if (searchCriteria.onlyActive && post.status !== "STILL_THERE") return { ...post, matchScore: 0 };
      if (searchCriteria.behavior !== "all" && post.behavior !== searchCriteria.behavior) return { ...post, matchScore: 0 };

      let score = 0;
      const isTypeMatch = searchCriteria.type === "all" || 
        (searchCriteria.type === "other" && post.animal_type !== "dog" && post.animal_type !== "cat") ||
        (post.animal_type === searchCriteria.type);

      if (!isTypeMatch) return { ...post, matchScore: 0 };
      score += 30;

      const dist = getDistanceFromLatLonInKm(searchCriteria.userLat, searchCriteria.userLng, parseFloat(post.latitude), parseFloat(post.longitude));
      if (dist < 2) score += 40; else if (dist < 10) score += 20;

      if (searchCriteria.keyword && post.description?.toLowerCase().includes(searchCriteria.keyword.toLowerCase())) score += 30;

      return { ...post, matchScore: Math.min(score, 100) };
    });

    const results = scoredPosts.filter(p => p.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
    setFilteredPosts(results);
    
    if (results.length > 0) {
      setMapView({ center: [parseFloat(results[0].latitude), parseFloat(results[0].longitude)], zoom: 15 });
    }
  };

  const handleReset = () => {
    setFilteredPosts(allAnimalPosts);
    setIsSmartSearchActive(false);
    setSearchCriteria(prev => ({ ...prev, keyword: "", type: "all", behavior: "all", onlyActive: true }));
  };

  return (
    <div className={`min-h-screen bg-white text-gray-800 ${mali.className}`}>
      <Header />
      
      {/* Hero Sections */}
      <div className="w-full">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-125">
          <div className="flex flex-col justify-center items-center p-8 order-2 md:order-1">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-[#FEFAE0] bg-opacity-10 px-4 py-2 rounded-full mb-6">
                <span className="text-sm">แจ้งพบสัตว์</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">ช่วยเหลือสัตว์ไร้บ้าน</h2>
              <p className="text-gray-600 mb-8">หากคุณพบสัตว์ที่ถูกทอดทิ้ง หรือเจ็บป่วย ทุกการแจ้งคือโอกาสใหม่ของหนึ่งชีวิต</p>
              <button onClick={() => router.push("/animal-report")} className="animate-bounce bg-[#D4A373] text-white font-semibold py-4 px-10 rounded-xl shadow-lg">แจ้งพบสัตว์ไร้บ้าน ได้ที่นี่</button>
            </div>
          </div>
          <div className="h-80 md:h-auto order-1 md:order-2 overflow-hidden group">
            <img src="/Cat2.jpg" alt="Stray Cat" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-125">
          <div className="h-80 md:h-auto overflow-hidden group">
            <img src="/Dog.png" alt="Smiling Dog" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          </div>
          <div className="flex flex-col justify-center items-center p-8">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-[#FEFAE0] bg-opacity-10 px-4 py-2 rounded-full mb-6">
                <span className="text-sm">หาบ้านใหม่</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">มอบบ้านใหม่ที่อบอุ่น</h2>
              <p className="text-gray-600 mb-8">เราขอช่วยเป็นสะพานให้สัตว์เลี้ยงที่คุณรักได้พบกับเจ้าของคนใหม่ที่อบอุ่น</p>
              <button onClick={() => router.push("/form-rehoming")} className="animate-bounce bg-[#D4A373] text-white font-semibold py-4 px-10 rounded-xl shadow-lg">หาบ้านให้น้อง ได้ที่นี่</button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center py-14 px-4">
        <div>
            <div className="bg-purple-100 text-purple-600 w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto"><Home className="w-7 h-7" /></div>
            <p className="text-3xl font-bold text-purple-600 mb-1">{stats.rehomingPosts}</p>
            <p className="text-gray-600">ประกาศหาบ้าน</p>
        </div>
        <div>
            <div className="bg-orange-100 text-[#D4A373] w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto"><PawPrint className="w-7 h-7" /></div>
            <p className="text-3xl font-bold text-[#D4A373] mb-1">{stats.foundAnimals}</p>
            <p className="text-gray-600">สัตว์ไร้บ้านที่พบ</p>
        </div>
        <div>
            <div className="bg-green-100 text-green-600 w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto"><Heart className="w-7 h-7" /></div>
            <p className="text-3xl font-bold text-green-600 mb-1">{stats.urgentHelp}</p>
            <p className="text-gray-600">คนช่วยเหลือ</p>
        </div>
      </section>

      {/* Smart Search Section */}
      <section className="px-4 pt-6 pb-2">
        <div className="p-6 text-black bg-gray-50 rounded-3xl">
          <div className="flex items-center gap-3 mb-5">
            <FaSearchLocation className="text-black text-xl" />
            <h2 className="text-xl font-bold">ค้นหาสัตว์เลี้ยง / กรองสัตว์ในพื้นที่</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <select className="flex-1 rounded-xl border px-4 py-3 outline-none" value={searchCriteria.type} onChange={(e) => setSearchCriteria({ ...searchCriteria, type: e.target.value })}>
              <option value="all">ทุกประเภท</option>
              <option value="dog">สุนัข</option>
              <option value="cat">แมว</option>
              <option value="other">อื่นๆ</option>
            </select>
            <select className="flex-1 rounded-xl border px-4 py-3 outline-none" value={searchCriteria.behavior} onChange={(e) => setSearchCriteria({ ...searchCriteria, behavior: e.target.value })}>
              <option value="all">พฤติกรรม (ทั้งหมด)</option>
              <option value="friendly">เชื่อง เข้าหาคนได้</option>
              <option value="injured">บาดเจ็บ ต้องการความช่วยเหลือ</option>
              <option value="aggressive">ดุร้าย</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-2 relative w-full">
              <input type="text" placeholder="ระบุลักษณะ..." className="w-full rounded-xl px-4 py-3 pl-10 border outline-none" value={searchCriteria.keyword} onChange={(e) => setSearchCriteria({ ...searchCriteria, keyword: e.target.value })} />
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            </div>
            <button onClick={handleSmartSearch} className="bg-[#D4A373] text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2"><BiTargetLock /> ค้นหา</button>
            {isSmartSearchActive && <button onClick={handleReset} className="bg-white text-black px-6 py-3 rounded-xl border shadow-md">ล้างค่า</button>}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full"><FiMapPin size={24} className="text-red-500" /></div>
          <h2 className="font-bold text-xl text-gray-800">
            {isSmartSearchActive ? `ผลการค้นหา (${filteredPosts.length} รายการ)` : "พิกัดสัตว์ไร้บ้าน"}
          </h2>
        </div>
        <div className="w-full h-[50vh] md:h-150 rounded-2xl overflow-hidden shadow-lg border-2 border-orange-100 relative z-0">
          <MapComponent 
            posts={filteredPosts} 
            center={mapView.center} 
            zoom={mapView.zoom} 
            isSmartSearch={isSmartSearchActive}
            router={router}
            formatDateTime={formatDateTime}
            getBehaviorLabel={getBehaviorLabel}
          />
        </div>
      </section>

      {/* Latest Rehoming Section */}
      <section className="px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 p-2 rounded-full"><FaHeart size={24} className="text-pink-500" /></div>
            <h2 className="font-bold text-xl text-gray-800">ประกาศหาบ้านล่าสุด</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {rehomingPosts.map((post) => (
            <PetCard key={post.post_id} post={post} />
          ))}
        </div>
        <div className="text-center mt-8">
          <button onClick={() => router.push("/rehoming-report")} className="px-6 py-2 border-2 border-[#D4A373] text-[#D4A373] rounded-full font-bold hover:bg-[#D4A373] hover:text-white transition-all">ดูประกาศทั้งหมด →</button>
        </div>
      </section>
    </div>
  );
}