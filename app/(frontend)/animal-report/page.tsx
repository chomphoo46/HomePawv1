"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/app/components/Header";
import dynamic from "next/dynamic";
import { HiPhoto, HiMapPin, HiXMark } from "react-icons/hi2";
import { MdOutlinePets } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { FaPaw, FaTrash } from "react-icons/fa"; // เพิ่ม icon ถังขยะ

const MapComponent = dynamic(() => import("@/app/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      กำลังโหลดแผนที่...
    </div>
  ),
});
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

  // ใส่ไว้ในตัวฟังก์ชัน ReportForm
  useEffect(() => {
    // ทำงานเฉพาะเมื่อเปิด Map และยังไม่มีตำแหน่งที่เคยเลือกไว้
    if (showMap && !selectedLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // ดึงที่อยู่ภาษาไทยจากพิกัดปัจจุบัน
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=th`,
              );
              const data = await res.json();

              // ส่งตำแหน่งปัจจุบันเข้าไปใน State
              setSelectedLocation({
                lat: latitude,
                lng: longitude,
                address: data.display_name || "ตำแหน่งปัจจุบันของคุณ",
              });
            } catch (error) {
              // ถ้าดึงที่อยู่ไม่สำเร็จ อย่างน้อยก็เอาพิกัดมา
              setSelectedLocation({
                lat: latitude,
                lng: longitude,
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              });
            }
          },
          (error) => {
            console.error("Geolocation Error:", error);
            // ถ้าผู้ใช้ไม่อนุญาตสิทธิ์ GPS แผนที่จะอยู่ที่ Default (กรุงเทพ) ตามที่คุณตั้งไว้ใน Picker
          },
        );
      }
    }
  }, [showMap]);
  // ฟังก์ชันรับพิกัดจาก Map Component
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setFormData((prev) => ({ ...prev, location: selectedLocation.address }));
    }
    setShowMap(false);
  };

  const handleMapToggle = () => setShowMap((prev) => !prev);

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
      const targetLat = selectedLocation?.lat || 0;
      const targetLng = selectedLocation?.lng || 0;
      router.push(`/?lat=${targetLat}&lng=${targetLng}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "เกิดข้อผิดพลาดในการส่งรายงาน");
    }
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
      <Header />

      {/* Hero Section - ปรับขนาด Text ให้ Responsive */}
      <div className="text-center pt-6 md:pt-10 pb-4 px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-[#D4A373] rounded-full mb-3 md:mb-4 shadow-lg">
          <MdOutlinePets className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          แจ้งพบสัตว์ไร้บ้าน
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto">
          ช่วยกันดูแลสัตว์เล็กสัตว์น้อยที่ต้องการความช่วยเหลือ
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-start md:justify-center px-4 py-4 md:py-8">
        {/* Container - ปรับขนาดตามหน้าจอ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5 md:p-8 w-full max-w-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            {/* ใช้ Grid ในจอใหญ่เพื่อลดความยาวฟอร์ม */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* ประเภทของสัตว์ */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  คุณพบสัตว์อะไร
                </label>
                <select
                  name="animalType"
                  value={formData.animalType}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] transition-all bg-white text-sm"
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
                      placeholder="ระบุชนิดสัตว์ (เช่น กระต่าย)"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] bg-white text-sm"
                    />
                  </div>
                )}
              </div>

              {/* พฤติกรรม */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  พฤติกรรมที่สังเกตเห็น
                </label>
                <select
                  name="behavior"
                  value={formData.behavior}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] transition-all bg-white text-sm"
                >
                  <option value="">-- เลือกพฤติกรรม --</option>
                  <option value="friendly">เชื่อง เข้าหาคนได้</option>
                  <option value="aggressive">ดุร้าย หลบหนี</option>
                  <option value="injured">บาดเจ็บ ต้องการความช่วยเหลือ</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </div>
            </div>

            {/* ลักษณะของสัตว์ - ใช้เต็มความกว้าง */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                ลักษณะของสัตว์
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="เช่น ขนสีน้ำตาล มีปลอกคอสีแดง"
                rows={2}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] transition-all bg-white text-sm"
              />
            </div>

            {/* สถานที่และแผนที่ */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                สถานที่พบสัตว์
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="เช่น หน้าห้างสยามพารากอน"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] bg-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="sm:w-auto inline-flex justify-center items-center px-4 py-3 bg-[#D4A373] text-white font-medium rounded-xl text-sm transition-all shadow-md"
                >
                  <HiMapPin className="w-4 h-4 mr-2" />
                  {formData.location ? "แก้ไขพิกัด" : "ปักหมุดบนแผนที่"}
                </button>
              </div>
              {selectedLocation && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg animate-pulse">
                  <p className="text-xs text-green-800 font-medium">
                    📍 {selectedLocation.address}
                  </p>
                </div>
              )}
            </div>

            {/* วันที่และเวลา */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                วันที่และเวลาที่พบ
              </label>
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleChange}
                max={new Date(
                  new Date().getTime() - new Date().getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] transition-all bg-white text-sm"
              />
            </div>

            {/* อัปโหลดรูปภาพ */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">
                  รูปภาพ (1-5 รูป)
                </label>
                <span className="text-[10px] md:text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                  {previewUrls.length} / 5
                </span>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-xl p-3 md:p-4 transition-all bg-white border-gray-200 ${previewUrls.length === 0 && "hover:border-[#D4A373] hover:bg-[#D4A373]/5"}`}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={previewUrls.length >= 5}
                  onChange={handleImageChange}
                  className="sr-only"
                />

                {previewUrls.length === 0 ? (
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center py-8 space-y-2"
                  >
                    <HiPhoto className="w-10 h-10 text-gray-300" />
                    <p className="text-xs font-semibold text-gray-500 text-center">
                      คลิกเพื่ออัปโหลดรูปภาพ
                    </p>
                  </label>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                    {previewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img src={url} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full shadow-sm"
                        >
                          <HiXMark className="w-3 h-3 md:w-4" />
                        </button>
                      </div>
                    ))}
                    {previewUrls.length < 5 && (
                      <label
                        htmlFor="file-upload"
                        className="aspect-square cursor-pointer rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#D4A373]"
                      >
                        <span className="text-xl">+</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ปุ่มส่งรายงาน */}
            <button
              type="submit"
              className="w-full bg-linear-to-r from-[#D4A373] to-[#FAEDCD] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-base md:text-lg mt-4"
            >
              ส่งรายงาน
            </button>
          </form>
        </div>
      </div>

      {/* Map Popup - ปรับขนาดให้เต็มจอในมือถือ */}
      {showMap && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header ของ Popup */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <HiMapPin className="mr-2 text-[#D4A373]" />{" "}
                ปักหมุดตำแหน่งสัตว์ที่พบบนแผนที่
              </h3>
              <button
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <HiXMark className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Body ของ Popup */}
            <div className="flex-1 md:flex-none p-4 space-y-4">
              {/* เปลี่ยนจาก div ref เดิม เป็น Map Component ใหม่ */}
              <div className="w-full h-[60vh] md:h-80 bg-gray-100 rounded-xl border overflow-hidden relative z-0">
                <MapComponent
                  onLocationSelect={handleLocationSelect}
                  initialPos={selectedLocation || undefined}
                />
              </div>

              {/* ส่วนแสดงที่วันที่เลือก (Address) */}
              <div className="min-h-15 p-3 bg-amber-50 rounded-lg border border-amber-200">
                {selectedLocation ? (
                  <p className="text-xs text-amber-700 font-medium">
                    📍 {selectedLocation.address}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    * กรุณาคลิกเลือกตำแหน่งบนแผนที่ หรือลากหมุดเพื่อระบุตำแหน่ง
                  </p>
                )}
              </div>

              {/* ปุ่มกดยืนยัน/ยกเลิก */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfirmLocation} // ฟังก์ชันที่เราสร้างใหม่เพื่อบันทึกที่อยู่ลง Form
                  disabled={!selectedLocation}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95"
                >
                  ยืนยันตำแหน่ง
                </button>
                <button
                  onClick={() => setShowMap(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
