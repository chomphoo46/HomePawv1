"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/app/components/Header";
import { HiPhoto, HiHeart, HiSparkles, HiXMark } from "react-icons/hi2";
import { FaPaw, FaCheck } from "react-icons/fa";
type ExistingImage = {
  id: number;
  image_url: string;
};

const initialForm = {
  pet_name: "",
  type: "",
  sex: "",
  age: "",
  vaccination_status: "",
  neutered_status: "",
  reason: "",
  phone: "",
  contact: "",
  address: "",
  images: [] as File[],
};

export default function FormRehomingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<{
    dateTime: string;
    images: File[];
  }>({ dateTime: "", images: [] });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
 
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
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const bangkokTime = new Date(now.getTime() - tzOffset);
    const formattedDate = bangkokTime.toISOString().slice(0, 16);
    setFormData((prev) => ({ ...prev, dateTime: formattedDate }));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

  if (status === "unauthenticated") {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    if (!/^[0-9]+$/.test(form.phone)) {
      setError("เบอร์โทรต้องเป็นตัวเลขเท่านั้น");
      setSubmitting(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("user_id", session?.user?.id ?? "");
      data.append("pet_name", form.pet_name);
      data.append("type", form.type);
      data.append("sex", form.sex);
      data.append("age", form.age);
      data.append("vaccination_status", form.vaccination_status);
      data.append("neutered_status", form.neutered_status);
      data.append("reason", form.reason);
      data.append("phone", form.phone);
      data.append("contact", form.contact);
      data.append("address", form.address);
      if (form.images.length > 0) {
        form.images.forEach((file) => {
          data.append("images", file);
        });
      }

      const res = await fetch("/api/rehoming-report", {
        method: "POST",
        body: data,
        credentials: "include",
      });

      if (res.ok) {
        setSuccess(true);
        setForm(initialForm);
        window.location.href = "/rehoming-report";
      } else {
        setError("เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#FEFAE0] via-white to-[#F4F3EE]">
      <Header />

      {/* Hero Section */}
      <div className="bg-linear-to-r from-[#D4A373] to-[#f1e8ad] text-white py-12 mb-8">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HiHeart className="text-4xl animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-bold">
              แจ้งหาบ้านให้สัตว์เลี้ยง
            </h1>
            <HiHeart className="text-4xl animate-pulse" />
          </div>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            ช่วยให้น้องหาบ้านใหม่ที่อบอุ่น
            เพื่อให้น้องได้รับความรักและการดูแลที่ดีที่สุด
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-[#FEFAE0] to-[#FAEDCD] px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <FaPaw className="text-[#D4A373]" />
              <span className="font-medium text-gray-700">
                กรอกข้อมูลสัตว์เลี้ยง
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Pet Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FaPaw className="text-[#D4A373]" />
                <h3 className="text-lg font-semibold text-gray-800">
                  ข้อมูลพื้นฐาน
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    ชื่อสัตว์เลี้ยง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pet_name"
                    placeholder="เช่น มิโกะ"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
                    value={form.pet_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    สายพันธุ์/ประเภท <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="type"
                    placeholder="เช่น บางแก้ว, ชิบะ อินุ"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
                    value={form.type}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    เพศ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sex"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white cursor-pointer"
                    value={form.sex}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- เลือกเพศ --</option>
                    <option value="MALE">เพศผู้</option>
                    <option value="FEMALE">เพศเมีย</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    อายุ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="age"
                    placeholder="เช่น 2 ปี 3 เดือน"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
                    value={form.age}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Health Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <HiHeart className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800">
                  ข้อมูลสุขภาพ
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    สถานะวัคซีน <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vaccination_status"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white cursor-pointer"
                    value={form.vaccination_status}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- เลือกสถานะวัคซีน --</option>
                    <option value="VACCINATED">ฉีดวัดซีนแล้ว</option>
                    <option value="NOT_VACCINATED">ยังไม่ได้ฉีดวัคซีน</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    สถานะการทำหมัน <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="neutered_status"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white cursor-pointer"
                    value={form.neutered_status}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- เลือกสถานะการทำหมัน --</option>
                    <option value="NEUTERED">ทำหมันแล้ว</option>
                    <option value="NOT_NEUTERED">ยังไม่ได้ทำหมัน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reason Section */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                เหตุผลที่หาบ้านใหม่ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                placeholder="กรุณาอธิบายเหตุผลที่ต้องการหาบ้านใหม่ให้น้อง..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                         focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                         transition-all duration-300 bg-white resize-none"
                value={form.reason}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <HiSparkles className="text-[#E76F51]" />
                <h3 className="text-lg font-semibold text-gray-800">
                  ข้อมูลการติดต่อ
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    เบอร์โทรติดต่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="08xxxxxxxx"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    ช่องทางติดต่ออื่น
                  </label>
                  <input
                    type="text"
                    name="contact"
                    placeholder="เช่น Line ID, Facebook"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                             focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                             transition-all duration-300 bg-white"
                    value={form.contact}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  ที่อยู่ <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none 
                           focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20 
                           transition-all duration-300 bg-white resize-none"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* DateTime */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                วันที่และเวลาที่แจ้ง <span className="text-red-500">*</span>
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

            {/* Image Upload */}
            {/* ✅ อัปโหลดรูปภาพ (UI แบบหน้าหาบ้าน) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  อัปโหลดรูปภาพ (1-5 รูป)
                </label>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                  {previewUrls.length} / 5 รูป
                </span>
              </div>

              {/* Container หลัก */}
              <div
                className={`border-2 border-dashed border-gray-300 rounded-2xl p-6 block transition-all 
                ${
                  previewUrls.length === 0
                    ? "hover:border-[#D4A373] hover:bg-[#D4A373]/5 bg-gray-50 cursor-pointer"
                    : "bg-white"
                }`}
              >
                {previewUrls.length > 0 ? (
                  // --- กรณีมีรูปภาพแล้ว (แสดง Grid) ---
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Loop แสดงรูปที่เลือกไว้ */}
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full rounded-xl shadow-md object-cover border border-gray-200"
                        />
                        {/* ปุ่มลบรูป (กากบาทสีแดง) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // กันไม่ให้กดไปโดน input อื่น
                            removeImage(idx);
                          }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm transition-colors"
                        >
                          <HiXMark className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* ปุ่ม + เพิ่มรูป (แสดงเมื่อยังไม่ครบ 5 รูป) */}
                    {previewUrls.length < 5 && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4A373] hover:bg-[#D4A373]/5 hover:text-[#D4A373] text-gray-400 transition-all bg-gray-50">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <span className="text-2xl mb-1">+</span>
                        <span className="text-xs font-medium">เพิ่มรูป</span>
                      </label>
                    )}
                  </div>
                ) : (
                  // --- กรณีไม่มีรูป (แสดงพื้นที่อัปโหลดใหญ่) ---
                  <label
                    htmlFor="file-upload"
                    className="block w-full h-full cursor-pointer text-center py-4"
                  >
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#D4A373]/20 transition-all">
                      <HiPhoto className="w-8 h-8 text-gray-400 group-hover:text-[#D4A373]" />
                    </div>
                    <div className="text-lg font-semibold text-gray-600 mb-2">
                      คลิกเพื่ออัปโหลดรูปภาพ
                    </div>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF สูงสุด 10MB (ไม่เกิน 5 รูป)
                    </p>
                    {/* Input หลักสำหรับตอนยังไม่มีรูป */}
                    <input
                      id="file-upload"
                      name="file-upload" // ต้องตรงกับ State
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                ❌ {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
                ✅ ส่งข้อมูลสำเร็จ!
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-linear-to-r fbg-gradient-to-r from-[#D4A373] to-[#FAEDCD] hover:from-[#D4A373] hover:to-[#F1E8AD]
                       text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl 
                       transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 
                       disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  กำลังส่งข้อมูล...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <HiHeart className="text-xl" />
                  ส่งข้อมูลหาบ้านให้น้อง
                  <HiHeart className="text-xl" />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
