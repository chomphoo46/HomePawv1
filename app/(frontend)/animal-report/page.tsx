"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/app/components/Header";
import { HiPhoto, HiMapPin, HiXMark } from "react-icons/hi2";
import { MdOutlinePets } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { FaPaw, FaTrash } from "react-icons/fa"; // เพิ่ม icon ถังขยะ

export default function ReportForm() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // ✅ เปลี่ยน State จากเก็บรูปเดียว เป็นเก็บ Array ของ File และ URL
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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
    customAnimal: "",
    description: "",
    behavior: "",
    location: "",
    dateTime: "",
    moreInfo: "",
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

  // Cleanup Preview URLs เมื่อ Component ถูกทำลาย (เพื่อไม่ให้กิน Ram)
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Map Logic
  useEffect(() => {
    if (!showMap) return;
    if (!mapContainerRef.current) return;

    const google = (window as any).google;
    if (!google) return;

    // สร้าง Geocoder ไว้ใช้งาน
    geocoderRef.current = new google.maps.Geocoder();

    // สร้างแผนที่ (ใช้พิกัดกรุงเทพฯ เป็น Default เผื่อดึงตำแหน่งปัจจุบันไม่ได้)
    const defaultLocation = { lat: 13.7563, lng: 100.5018 };
    mapRef.current = new google.maps.Map(mapContainerRef.current, {
      center: defaultLocation,
      zoom: 15,
    });

    // --- ส่วนที่เพิ่ม: ดึงตำแหน่งปัจจุบัน ---
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // เลื่อนแผนที่ไปที่ตำแหน่งปัจจุบัน
          mapRef.current.setCenter(currentPos);

          // ปักหมุดที่ตำแหน่งปัจจุบันทันที
          if (!markerRef.current) {
            markerRef.current = new google.maps.Marker({
              position: currentPos,
              map: mapRef.current,
              draggable: true,
              animation: google.maps.Animation.DROP,
            });

            // เพิ่ม Event ลากหมุด
            markerRef.current.addListener("dragend", (event: any) => {
              updateLocation(event.latLng.lat(), event.latLng.lng());
            });
          } else {
            markerRef.current.setPosition(currentPos);
          }

          // อัปเดตที่อยู่จากพิกัด
          updateLocation(currentPos.lat, currentPos.lng);
        },
        () => {
          console.warn("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้");
        },
      );
    }
    // ------------------------------------

    // Event คลิกบนแผนที่เดิม
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
  }, [showMap]);

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
      },
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
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ ฟังก์ชันเพิ่มรูปภาพ (รองรับการเลือกทีละหลายรูป)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);

    // ตรวจสอบจำนวนรูป (รวมของเก่า + ของใหม่ ต้องไม่เกิน 5)
    if (selectedImages.length + newFiles.length > 5) {
      alert("สามารถอัปโหลดรูปภาพได้สูงสุด 5 รูป");
      return;
    }

    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedImages((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    // Reset value เพื่อให้เลือกรูปเดิมซ้ำได้ถ้าต้องการ (กรณีลบแล้วเพิ่มใหม่)
    e.target.value = "";
  };

  // ✅ ฟังก์ชันลบรูปภาพ
  const removeImage = (index: number) => {
    // ลบ URL ออกจาก memory
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: "/animal-report" });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#FEFAE0] to-[#F4F3EE]">
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
      alert("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      return;
    }

    if (formData.animalType === "other" && !formData.customAnimal) {
      alert("กรุณาระบุประเภทสัตว์");
      return;
    }

    // Validation: ตรวจสอบรูปภาพ
    if (selectedImages.length === 0) {
      alert(
        "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป เพื่อช่วยให้น้องได้รับการช่วยเหลือที่เร็วขึ้น",
      );
      return;
    }

    try {
      // --- ส่วนที่ 1: อัปโหลดรูปภาพไปยัง Vercel Blob ---
      const uploadedUrls: string[] = [];

      for (const file of selectedImages) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok)
          throw new Error(`ไม่สามารถอัปโหลดรูป ${file.name} ได้`);

        const { url } = await uploadRes.json();
        uploadedUrls.push(url);
      }

      // --- ส่วนที่ 2: ส่งข้อมูลรายงานทั้งหมด (JSON) ไปยัง Database ---
      const finalAnimalType =
        formData.animalType === "other"
          ? formData.customAnimal
          : formData.animalType;

      const res = await fetch("/api/animal-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animalType: finalAnimalType,
          description: formData.description,
          behavior: formData.behavior,
          location: formData.location,
          dateTime: formData.dateTime,
          moreInfo: formData.moreInfo,
          lat: selectedLocation?.lat || 0,
          lng: selectedLocation?.lng || 0,
          images: uploadedUrls, // ส่งอาเรย์ของ URL ที่ได้จาก Blob
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.error || "ไม่ทราบสาเหตุ"}`);
        return;
      }

      alert("ส่งรายงานสำเร็จ! ขอบคุณที่ช่วยเหลือน้องๆ ครับ");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "เกิดข้อผิดพลาดในการส่งรายงาน");
    }
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
      <Header />

      {/* Hero Section */}
      <div className="text-center pt-8 pb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4A373] rounded-full mb-4 shadow-lg">
          <MdOutlinePets className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          แจ้งพบสัตว์ไร้บ้าน
        </h1>
        <p className="text-gray-600 max-w-md mx-auto px-4">
          ช่วยกันดูแลสัตว์เล็กสัตว์น้อยที่ต้องการความช่วยเหลือ
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 w-full max-w-lg space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... (ส่วนเลือกประเภทสัตว์ ลักษณะ พฤติกรรม และสถานที่ เหมือนเดิม ไม่มีการเปลี่ยนแปลง) ... */}

            {/* ประเภทของสัตว์ */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                คุณพบสัตว์อะไร
              </label>
              <select
                name="animalType"
                value={formData.animalType}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300 bg-white"
              >
                <option value="">-- เลือกประเภทสัตว์ --</option>
                <option value="dog">สุนัข</option>
                <option value="cat">แมว</option>
                <option value="other">อื่น ๆ (โปรดระบุ)</option>
              </select>
              {formData.animalType === "other" && (
                <div className="mt-3 animate-fade-in-down">
                  <input
                    type="text"
                    name="customAnimal"
                    value={formData.customAnimal || ""}
                    onChange={handleChange}
                    placeholder="โปรดระบุชนิดสัตว์ (เช่น กระต่าย, นก)"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300 bg-white placeholder-gray-400"
                  />
                </div>
              )}
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300 bg-white"
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300 bg-white"
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300 bg-white"
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

            {/* แผนที่ Popup (เหมือนเดิม) */}
            {showMap && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                {/* ... Code แผนที่ ... */}
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
                        className="flex-1 bg-linear-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 transition-all duration-300 bg-white"
              />
            </div>

            {/* ✅ อัปโหลดรูปภาพ (UI ใหม่: รูปอยู่ในกรอบ) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  อัปโหลดรูปภาพ (1-5 รูป)
                </label>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                  {previewUrls.length} / 5 รูป
                </span>
              </div>

              {/* Main Upload Container Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 bg-white
                  ${
                    previewUrls.length > 0
                      ? "border-gray-300"
                      : "border-gray-300 hover:border-[#D4A373] hover:bg-[#D4A373]/5 group"
                  }`}
              >
                {/* Hidden Input Field */}
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept="image/*"
                  multiple // สำคัญ: เลือกหลายรูป
                  disabled={previewUrls.length >= 5}
                  onChange={handleImageChange}
                  className="sr-only"
                />

                {/* CASE 1: ยังไม่มีรูปเลย -> แสดง Placeholder ตรงกลาง */}
                {previewUrls.length === 0 && (
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center h-32 space-y-3"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#D4A373]/20">
                      <HiPhoto className="w-6 h-6 text-gray-400 group-hover:text-[#D4A373] transition-colors duration-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600">
                        คลิกเพื่อเพิ่มรูปภาพ
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        สูงสุด 5 รูป (JPG, PNG)
                      </p>
                    </div>
                  </label>
                )}

                {/* CASE 2: มีรูปแล้ว -> แสดง Grid รูปภาพ + ปุ่ม Add More */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Loop แสดงรูปที่มีอยู่ */}
                    {previewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group/item aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* ปุ่มลบ (กากบาทมุมขวาบน) */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-white/80 hover:bg-red-50 text-gray-600 hover:text-red-500 p-1 rounded-full shadow-sm transition-all opacity-0 group-hover/item:opacity-100 scale-90 hover:scale-100"
                          title="ลบรูปภาพ"
                        >
                          <HiXMark className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* ปุ่ม "เพิ่มรูป" (แสดงถ้ายังไม่ครบ 5) */}
                    {previewUrls.length < 5 && (
                      <label
                        htmlFor="file-upload"
                        className="aspect-square cursor-pointer rounded-lg border-2 border-dashed border-gray-300 hover:border-[#D4A373] hover:bg-[#D4A373]/10 flex flex-col items-center justify-center text-gray-400 hover:text-[#D4A373] transition-all duration-200 group/add"
                      >
                        <HiPhoto className="w-8 h-8 mb-1 transition-transform group-hover/add:scale-110" />
                        <span className="text-xs font-semibold">
                          + เพิ่มรูป
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Helper Text */}
              {previewUrls.length > 0 && previewUrls.length < 5 && (
                <p className="text-xs text-gray-500 text-right">
                  สามารถเพิ่มได้อีก {5 - previewUrls.length} รูป
                </p>
              )}
            </div>

            {/* ปุ่มส่ง */}
            <button
              type="submit"
              className="w-full bg-linear-to-r from-[#D4A373] to-[#FAEDCD] hover:from-[#D4A373] hover:to-[#F1E8AD]
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
