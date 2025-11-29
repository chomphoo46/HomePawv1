"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/app/components/Header";
import { HiPhoto, HiMapPin, HiClock, HiHeart, HiXMark } from "react-icons/hi2";
import { MdOutlinePets } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { FaPaw } from "react-icons/fa";
export default function ReportForm() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    animalType: "",
    description: "",
    behavior: "",
    location: "",
    dateTime: "",
    moreInfo: "",
    image: null as File | null,
  });

  // ตั้งค่าวันที่ปัจจุบัน
  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const bangkokTime = new Date(now.getTime() - tzOffset);
    setFormData((prev) => ({
      ...prev,
      dateTime: bangkokTime.toISOString().slice(0, 16),
    }));
  }, []);

  // เมื่อ showMap เป็น true และ container พร้อม ให้ init map
  useEffect(() => {
    if (!showMap) return; // ถ้า modal ปิด ไม่ต้องทำงาน
    if (!mapContainerRef.current) return; // ตรวจสอบ container

    const google = (window as any).google;
    if (!google || mapRef.current) return; // ถ้า google ยังไม่โหลด หรือ map สร้างแล้ว return

    geocoderRef.current = new google.maps.Geocoder();
    mapRef.current = new google.maps.Map(mapContainerRef.current, {
      center: { lat: 13.7563, lng: 100.5018 },
      zoom: 14,
    });

    // เพิ่ม listener สำหรับ click บน map
    mapRef.current.addListener("click", (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          draggable: true,
        });
        markerRef.current.addListener("dragend", (event: any) => {
          updateLocation(event.latLng.lat(), event.latLng.lng());
        });
      } else {
        markerRef.current.setPosition({ lat, lng });
      }

      updateLocation(lat, lng);
    });
  }, [showMap]); // watch showMap

  const updateLocation = (lat: number, lng: number) => {
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, image: file })); // <-- จุดที่ 1 (ของเดิมไม่มี)
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: "/animal-report" });
    }
  }, [status]); // เอา router ออก
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFAE0] to-[#F4F3EE]">
        <div className="text-center">
          <FaPaw className="animate-bounce text-4xl text-[#D4A373] mx-auto mb-4" />
          <div className="text-lg text-gray-600">กำลังตรวจสอบสิทธิ์...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      alert("Unauthorized");
      return;
    }

    const data = new FormData();
    data.append("animalType", formData.animalType);
    data.append("description", formData.description);
    data.append("behavior", formData.behavior);
    data.append("location", formData.location);
    data.append("dateTime", formData.dateTime);
    data.append("moreInfo", formData.moreInfo);
    data.append("lat", selectedLocation?.lat.toString() || "");
    data.append("lng", selectedLocation?.lng.toString() || "");

    if (formData.image) data.append("images", formData.image);
    try {
      const res = await fetch("/api/animal-report", {
        method: "POST",
        body: data,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.error || "ไม่ทราบสาเหตุ"}`);
        return;
      }

      alert("ส่งรายงานสำเร็จ!");
      router.push("/"); // กลับหน้าหลัก
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการส่งรายงาน");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
      <Header />

      {/* Hero Section */}
      <div className="text-center pt-8 pb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4A373] rounded-full mb-4 shadow-lg">
          <MdOutlinePets className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font.bold text-gray-800 mb-2">
          แจ้งพบสัตว์ไร้บ้าน
        </h1>
        <p className="text-gray-600 max-w-md mx-auto px-4">
          ช่วยกันดูแลสัตว์เล็กสัตว์น้อยที่ต้องการความช่วยเหลือ
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 w-full max-w-lg space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ประเภทของสัตว์ */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                คุณพบสัตว์อะไร
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

            {/* ลักษณะของสัตว์ */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                ลักษณะของสัตว์
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="เช่น ขนสีน้ำตาล มีปลอกคอสีแดง ตัวเล็ก น่ารัก"
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
              />
            </div>

            {/* พฤติกรรม */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                พฤติกรรมที่สังเกตเห็น
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
                สถานที่พบสัตว์
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="เช่น หน้าห้างสยามพารากอน ถนนพระราม 1"
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
                {showMap ? "ปิดแผนที่" : "ปักหมุดบนแผนที่"}
              </button>

              {selectedLocation && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    📍 ตำแหน่งที่เลือก:
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {selectedLocation.address}
                  </p>
                </div>
              )}
            </div>

            {/* แผนที่ */}
            {showMap && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                      📍 เลือกตำแหน่งบนแผนที่
                    </h3>
                    <button
                      onClick={() => setShowMap(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <HiXMark className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      คลิกบนแผนที่เพื่อปักหมุดตำแหน่งที่พบสัตว์
                    </p>
                    <div
                      ref={mapContainerRef}
                      className="w-full h-64 bg-gray-100 rounded-lg border-2 border-gray-200"
                    />

                    {selectedLocation && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-medium text-amber-800">
                          ตำแหน่งที่เลือก:
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          {selectedLocation.address}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleSelectLocation}
                        disabled={!selectedLocation}
                        className="flex-1 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                      >
                        ยืนยันตำแหน่ง
                      </button>
                      <button
                        onClick={() => setShowMap(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* วันที่และเวลา */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                วันที่และเวลาที่พบ
              </label>
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
              />
            </div>

            {/* อัปโหลดภาพสัตว์ */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                รูปภาพประกอบ
              </label>

              <label
                htmlFor="file-upload"
                className="cursor-pointer text-center border-2 border-dashed border-gray-300 rounded-xl p-8 block transition-all duration-300 hover:border-[#D4A373] hover:bg-[#D4A373]/5 bg-white group"
              >
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto max-h-48 object-contain rounded-lg shadow-md"
                    />
                    {fileName && (
                      <p className="text-sm text-gray-600 font-medium">
                        {fileName}
                      </p>
                    )}
                    <p className="text-xs text-amber-600">
                      คลิกเพื่อเปลี่ยนรูป
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center transition-all duration-300">
                      <HiPhoto className="w-8 h-8 text-gray-400  transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-600 mb-2">
                        คลิกเพื่ออัปโหลดรูปภาพ
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        PNG, JPG, GIF สูงสุด 10MB
                      </p>
                    </div>
                  </div>
                )}
              </label>

              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="image/*"
                //
                // ▼▼▼▼▼▼▼▼▼▼▼▼▼ [แก้ไขจุดที่ 1] ▼▼▼▼▼▼▼▼▼▼▼▼▼
                //
                // ใช้ handleImageChange ที่เราแก้ไขแล้ว
                onChange={handleImageChange}
                //
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲ [แก้ไขจุดที่ 1] ▲▲▲▲▲▲▲▲▲▲▲▲▲
                //
                className="sr-only"
              />
            </div>

            {/* ปุ่มส่ง */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4A373] to-[#FAEDCD] hover:from-[#D4A373] hover:to-[#F1E8AD]
             text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl 
             transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 
             disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              ส่งรายงาน
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
