"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HiPhoto, HiHeart, HiSparkles } from "react-icons/hi2";
import { FaPaw } from "react-icons/fa";
import Header from "@/app/components/Header";

interface ExistingImage {
  id: number;
  image_url: string;
}

// ตัวอย่างฟังก์ชันอัปโหลดไฟล์ (ต้องมี API /api/upload ของคุณ)
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");

  const data = await res.json();
  return data.url; // URL ของไฟล์ที่อัปโหลด
}

export default function EditRehomingPage() {
  const params = useParams();
  const router = useRouter();
  const post_id = Number(params?.post_id);

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    pet_name: "",
    type: "",
    sex: "",
    age: "",
    neutered_status: "",
    vaccination_status: "",
    address: "",
    phone: "",
    reason: "",
    status: "",
    contact: "",
    created_at: "",
    images: [] as File[],
  });

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);

  // ดึงข้อมูลโพสต์
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/rehoming-report/${post_id}`);
        if (!res.ok) throw new Error("ไม่พบข้อมูลโพสต์");
        const data = await res.json();

        setFormData({
          pet_name: data.pet_name,
          type: data.type,
          sex: data.sex,
          age: data.age,
          neutered_status: data.neutered_status,
          vaccination_status: data.vaccination_status,
          address: data.address,
          phone: data.phone,
          reason: data.reason,
          status: data.status,
          contact: data.contact,
          created_at: data.created_at,
          images: [],
        });

        setExistingImages(data.images || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (post_id) fetchPost();
  }, [post_id]);

  // set default created_at เป็นเวลาปัจจุบัน
  useEffect(() => {
    if (!formData.created_at) {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const bangkokTime = new Date(now.getTime() - tzOffset);
      const formattedDate = bangkokTime.toISOString().slice(0, 16);
      setFormData((prev) => ({ ...prev, created_at: formattedDate }));
    }
  }, [formData.created_at]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle new file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const urls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewFiles((prev) => [...prev, ...urls]);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...filesArray],
      }));
    }
  };

  // Remove existing image
  const handleRemoveExistingImage = (id: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setDeletedImageIds((prev) => [...prev, id]);
  };

  // Remove new uploaded image
  const handleRemoveNewImage = (index: number) => {
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => {
      const newFiles = [...prev.images];
      newFiles.splice(index, 1);
      return { ...prev, images: newFiles };
    });
  };

  // Handle submit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let uploadedUrls: string[] = [];

      // อัปโหลดไฟล์ใหม่ก่อน
      if (formData.images.length > 0) {
        uploadedUrls = await Promise.all(
          formData.images.map(async (file) => {
            const url = await uploadFile(file);
            return url;
          })
        );
      }

      const payload = {
        ...formData,
        deletedImageIds,
        images: uploadedUrls, // Prisma ต้องการ array ของ string URL
      };

      const res = await fetch(`/api/rehoming-report/${post_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("อัปเดตโพสต์ไม่สำเร็จ");

      router.push(`/profile`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-center p-6">กำลังโหลด...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFAE0] via-white to-[#F4F3EE]">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pb-12 pt-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#FEFAE0] to-[#FAEDCD] px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <FaPaw className="text-[#D4A373]" />
              <span className="font-medium text-gray-700">
                แก้ไขข้อมูลสัตว์เลี้ยง
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-6 md:p-8 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FaPaw className="text-[#D4A373]" />
                <h3 className="text-lg font-semibold text-gray-800">
                  ข้อมูลพื้นฐาน
                </h3>
              </div>
              <label className="block font-medium text-gray-700">
                ชื่อสัตว์เลี้ยง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pet_name"
                value={formData.pet_name}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
              />
              <label className="block font-medium text-gray-700">
                สายพันธุ์/ประเภท <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
                >
                  <option value="">-- เลือกเพศ --</option>
                  <option value="MALE">เพศผู้</option>
                  <option value="FEMALE">เพศเมีย</option>
                </select>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  placeholder="เช่น 2 ปี 3 เดือน"
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
                />
              </div>
            </div>

            {/* Health Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <HiHeart className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800">
                  ข้อมูลสุขภาพ
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  name="vaccination_status"
                  value={formData.vaccination_status}
                  onChange={handleChange}
                  required
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
                >
                  <option value="">-- เลือกสถานะวัคซีน --</option>
                  <option value="VACCINATED">ฉีดวัคซีนแล้ว</option>
                  <option value="NOT_VACCINATED">ยังไม่ได้ฉีดวัคซีน</option>
                </select>
                <select
                  name="neutered_status"
                  value={formData.neutered_status}
                  onChange={handleChange}
                  required
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
                >
                  <option value="">-- เลือกสถานะการทำหมัน --</option>
                  <option value="NEUTERED">ทำหมันแล้ว</option>
                  <option value="NOT_NEUTERED">ยังไม่ได้ทำหมัน</option>
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-medium text-gray-700">
                เหตุผลที่หาบ้านใหม่ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
              />
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <HiSparkles className="text-[#E76F51]" />
                <h3 className="text-lg font-semibold text-gray-800">
                  ข้อมูลการติดต่อ
                </h3>
              </div>
              <label className="block font-medium text-gray-700">
                เบอร์โทรติดต่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700">
                ที่อยู่ <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4A373] focus:ring-2 focus:ring-[#D4A373]/20"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block mb-3 font-medium text-gray-700">
                รูปภาพ
              </label>
              <div className="flex flex-wrap gap-4">
                {/* Existing Images */}
                {existingImages.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.image_url}
                      alt="existing"
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(img.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* New Uploaded Images */}
                {previewFiles.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={url}
                      alt="preview"
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="text-gray-400">+ เพิ่มรูป</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#D4A373] text-white font-semibold py-3 rounded-xl hover:bg-[#D4A373]/90 transition-all duration-300"
            >
              แก้ไขรายงาน
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
