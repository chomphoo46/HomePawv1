"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/app/components/Header";
import { HiPhoto, HiHeart, HiSparkles } from "react-icons/hi2";
import { FaPaw, FaCheck } from "react-icons/fa";

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
  const [formData, setFormData] = useState({ dateTime: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      setFileName(file.name);
      setForm((prev) => ({ ...prev, images: [file] }));
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFAE0] to-[#F4F3EE]">
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
        data.append("images", form.images[0]);
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

  const steps = [
    { id: 1, title: "ข้อมูลพื้นฐาน", icon: FaPaw },
    { id: 2, title: "สุขภาพ", icon: HiHeart },
    { id: 3, title: "การติดต่อ", icon: HiSparkles },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFAE0] via-white to-[#F4F3EE]">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#D4A373] to-[#E76F51] text-white py-12 mb-8">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HiHeart className="text-4xl animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-bold">แจ้งหาบ้านให้สัตว์เลี้ยง</h1>
            <HiHeart className="text-4xl animate-pulse" />
          </div>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            ช่วยให้น้องหาบ้านใหม่ที่อบอุ่น เพื่อให้น้องได้รับความรักและการดูแลที่ดีที่สุด
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                    ${isActive 
                      ? 'bg-[#D4A373] border-[#D4A373] text-white shadow-lg' 
                      : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? <FaCheck /> : <Icon />}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-sm font-medium ${isActive ? 'text-[#D4A373]' : 'text-gray-500'}`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-[#D4A373]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#FEFAE0] to-[#FAEDCD] px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <FaPaw className="text-[#D4A373]" />
              <span className="font-medium text-gray-700">กรอกข้อมูลสัตว์เลี้ยง</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Pet Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FaPaw className="text-[#D4A373]" />
                <h3 className="text-lg font-semibold text-gray-800">ข้อมูลพื้นฐาน</h3>
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
                <h3 className="text-lg font-semibold text-gray-800">ข้อมูลสุขภาพ</h3>
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
                    <option value="VACCINATED">✅ ฉีดวัดซีนแล้ว</option>
                    <option value="NOT_VACCINATED">❌ ยังไม่ได้ฉีดวัคซีน</option>
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
                    <option value="NEUTERED">✅ ทำหมันแล้ว</option>
                    <option value="NOT_NEUTERED">❌ ยังไม่ได้ทำหมัน</option>
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
                <h3 className="text-lg font-semibold text-gray-800">ข้อมูลการติดต่อ</h3>
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
            <div>
              <label className="block mb-3 font-medium text-gray-700">
                อัปโหลดรูปภาพ <span className="text-red-500">*</span>
              </label>
              <label
                htmlFor="file-upload"
                className="cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-8 block 
                         transition-all hover:border-[#D4A373] hover:bg-[#D4A373]/5 bg-gray-50"
              >
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 rounded-xl shadow-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 
                                    transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white font-medium">คลิกเพื่อเปลี่ยนรูป</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 font-medium text-center">
                      {fileName}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <HiPhoto className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                    <div className="text-lg font-semibold text-gray-600 mb-2">
                      คลิกเพื่ออัปโหลดรูปภาพ
                    </div>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF สูงสุด 10MB
                    </p>
                  </div>
                )}
              </label>
              <input
                id="file-upload"
                name="images"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
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
              className="w-full bg-gradient-to-r from-[#D4A373] to-[#E76F51] hover:from-[#E76F51] hover:to-[#D4A373] 
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