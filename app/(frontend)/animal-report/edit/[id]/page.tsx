"use client";

import { useState, useEffect, useRef, FormEvent, use } from "react"; // 1. เพิ่ม use
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { HiPhoto, HiMapPin, HiXMark } from "react-icons/hi2";
import { MdEdit } from "react-icons/md";
import { FaPaw } from "react-icons/fa";
import { Mali } from "next/font/google";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

// 2. อัปเดต Type ของ params เป็น Promise
export default function EditAnimalReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // 3. ใช้ use() เพื่อดึงค่า id ออกมาจาก Promise
  const { id } = use(params);

  // State
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Map State
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Form Data
  const [formData, setFormData] = useState({
    animalType: "",
    description: "",
    behavior: "",
    location: "",
    dateTime: "",
    status: "", 
  });

  // 1. ดึงข้อมูลเก่ามาแสดงจาก API จริง
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/animal-report/my-posts", { cache: "no-store" });
        if (!res.ok) throw new Error("ดึงข้อมูลไม่สำเร็จ");
        
        const posts = await res.json();
        // ใช้ id ที่แกะมาจาก use(params)
        const post = posts.find((p: any) => p.report_id == id);

        if (post) {
          setFormData({
            animalType: post.animal_type || "other",
            description: post.description || "",
            behavior: post.behavior || "",
            location: post.location || "",
            dateTime: post.created_at ? new Date(post.created_at).toISOString().slice(0, 16) : "",
            status: post.status || "STILL_THERE",
          });

          if (post.latitude && post.longitude) {
            setSelectedLocation({
              lat: Number(post.latitude),
              lng: Number(post.longitude),
              address: post.location || "",
            });
          }

          if (post.images && post.images.length > 0) {
            setPreviewUrl(post.images[0].image_url);
          }
        } else {
            alert("ไม่พบข้อมูล");
            router.push("/profile");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, router]);

  // 2. Map Logic
  useEffect(() => {
    if (!showMap) return;
    if (!mapContainerRef.current) return;

    const google = (window as any).google;
    if (!google) return; 

    if (!mapRef.current) {
        geocoderRef.current = new google.maps.Geocoder();
        const center = selectedLocation 
            ? { lat: selectedLocation.lat, lng: selectedLocation.lng } 
            : { lat: 13.7563, lng: 100.5018 };

        mapRef.current = new google.maps.Map(mapContainerRef.current, {
            center: center,
            zoom: 14,
        });

        mapRef.current.addListener("click", (e: any) => {
            handleMapClick(e.latLng.lat(), e.latLng.lng());
        });
    }

    if (selectedLocation) {
        if (!markerRef.current) {
            markerRef.current = new google.maps.Marker({
                position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
                map: mapRef.current,
                draggable: true,
            });
            markerRef.current.addListener("dragend", (event: any) => {
                handleMapClick(event.latLng.lat(), event.latLng.lng());
            });
        } else {
            markerRef.current.setPosition({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        }
        mapRef.current.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    }
  }, [showMap]);

  const handleMapClick = (lat: number, lng: number) => {
      const google = (window as any).google;
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          draggable: true,
        });
        markerRef.current.addListener("dragend", (event: any) => {
            updateLocationFromLatLng(event.latLng.lat(), event.latLng.lng());
        });
      } else {
        markerRef.current.setPosition({ lat, lng });
      }
      updateLocationFromLatLng(lat, lng);
  };

  const updateLocationFromLatLng = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          setSelectedLocation({
            lat,
            lng,
            address: results[0].formatted_address,
          });
        }
      }
    );
  };

  const handleMapToggle = () => setShowMap((prev) => !prev);

  const handleSelectLocation = () => {
    if (selectedLocation)
      setFormData((prev) => ({ ...prev, location: selectedLocation.address }));
    setShowMap(false);
  };

  // 3. Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 4. Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
        const payload = {
            report_id: parseInt(id), // ใช้ id ที่แกะมาแล้ว
            animal_type: formData.animalType,
            description: formData.description,
            behavior: formData.behavior,
            location: formData.location,
            status: formData.status,
            latitude: selectedLocation?.lat,
            longitude: selectedLocation?.lng
        };

        const res = await fetch("/api/animal-report/my-posts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "แก้ไขไม่สำเร็จ");
        }

        alert("แก้ไขข้อมูลเรียบร้อย ✅");
        router.push("/profile");
        router.refresh();

    } catch (err: any) {
        console.error(err);
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="text-center">
          <FaPaw className="animate-bounce text-4xl text-[#D4A373] mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col ${mali.className}`}>
      <Header />

      {/* Hero Section */}
      <div className="text-center pt-8 pb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4A373] rounded-full mb-4 shadow-lg">
          <MdEdit className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          แก้ไขรายงาน
        </h1>
        <p className="text-gray-600 max-w-md mx-auto px-4">
          อัปเดตข้อมูลหรือสถานะล่าสุดของน้อง
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 w-full max-w-lg space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* สถานะ (Status) */}
            <div className="space-y-2 bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
              <label className="flex items-center text-base font-bold text-amber-800 mb-2">
                สถานะปัจจุบัน <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white text-gray-700 font-semibold cursor-pointer"
              >
                <option value="STILL_THERE">🔴 ยังอยู่ที่เดิม (ต้องการความช่วยเหลือ)</option>
                <option value="RESCUED">🟢 ช่วยเหลือแล้ว (จบเคส)</option>
                <option value="MOVED">🟡 ย้ายที่แล้ว / หาไม่เจอ</option>
                <option value="OTHER">⚪ อื่นๆ</option>
              </select>
              <p className="text-xs text-amber-600/80 mt-1 pl-1">
                * โปรดอัปเดตสถานะเพื่อเป็นข้อมูลให้คนอื่น ๆ ทราบ
              </p>
            </div>

            {/* ประเภทของสัตว์ */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                ประเภทสัตว์
              </label>
              <select
                name="animalType"
                value={formData.animalType}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
              >
                <option value="">-- เลือกประเภทสัตว์ --</option>
                <option value="dog">สุนัข</option>
                <option value="cat">แมว</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>

            {/* ลักษณะ */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                ลักษณะของสัตว์
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
              />
            </div>

            {/* พฤติกรรม */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                พฤติกรรม
              </label>
              <select
                name="behavior"
                value={formData.behavior}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
              >
                <option value="">-- เลือกพฤติกรรม --</option>
                <option value="friendly">เชื่อง เข้าหาคนได้</option>
                <option value="aggressive">ดุร้าย หลบหนี</option>
                <option value="injured">บาดเจ็บ ต้องการความช่วยเหลือ</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>

            {/* สถานที่ */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                สถานที่พบ
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
              />
              <button
                type="button"
                onClick={handleMapToggle}
                className="mt-3 inline-flex items-center px-4 py-2 bg-[#D4A373] text-white font-medium rounded-lg text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <HiMapPin className="w-4 h-4 mr-2" />
                {showMap ? "ปิดแผนที่" : "ปักหมุดแก้ไขตำแหน่ง"}
              </button>

              {selectedLocation && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    📍 ตำแหน่งใหม่ที่เลือก:
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {selectedLocation.address}
                  </p>
                </div>
              )}
            </div>

            {/* Map Modal */}
            {showMap && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">📍 แก้ไขตำแหน่ง</h3>
                    <button onClick={() => setShowMap(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <HiXMark className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      เลื่อนหมุดเพื่อระบุตำแหน่งใหม่
                    </p>
                    <div ref={mapContainerRef} className="w-full h-64 bg-gray-100 rounded-lg border-2 border-gray-200" />
                    {selectedLocation && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-medium text-amber-800">
                           ตำแหน่ง:
                        </p>
                        <p className="text-xs text-amber-600 mt-1">{selectedLocation.address}</p>
                      </div>
                    )}
                    <div className="flex gap-3 mt-4">
                      <button onClick={handleSelectLocation} disabled={!selectedLocation} 
                        className="flex-1 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white py-2 rounded-lg transition-all shadow-md disabled:opacity-50"
                      >
                        ยืนยันตำแหน่ง
                      </button>
                      <button onClick={() => setShowMap(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors">
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* รูปภาพ (แสดง Preview แบบ Read-Only) */}
            <div className="space-y-2">
               <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                 รูปภาพประกอบ
               </label>
               <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center text-center">
                 {previewUrl ? (
                   <div className="relative group">
                       <img src={previewUrl} alt="Preview" className="max-h-56 rounded-lg shadow-md object-cover transition-opacity group-hover:opacity-90" />
                       <div className="mt-3 text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border">
                          รูปภาพปัจจุบัน
                       </div>
                   </div>
                 ) : (
                   <div className="text-gray-400 flex flex-col items-center py-4">
                     <HiPhoto className="w-10 h-10 mb-2 opacity-50" />
                     <span className="text-sm">ไม่มีรูปภาพ</span>
                   </div>
                 )}
                 <p className="text-xs text-red-400 mt-4 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    * หากต้องการเปลี่ยนรูปภาพ กรุณาลบโพสต์นี้แล้วสร้างใหม่
                 </p>
               </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                ยกเลิก
                </button>
                <button
                type="submit"
                className="flex-[2] bg-gradient-to-r from-[#D4A373] to-[#FAEDCD] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                บันทึกการแก้ไข
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}