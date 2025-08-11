"use client";

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";

export default function ReportForm() {
  const [formData, setFormData] = useState({
    animalType: "",
    description: "",
    behavior: "",
    location: "",
    status: "",
    dateTime: "",
    moreInfo: "",
    image: null as File | null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();

    // ปรับเวลามาเป็น Asia/Bangkok (UTC+7)
    const tzOffset = now.getTimezoneOffset() * 60000; // นาที → ms
    const bangkokTime = new Date(now.getTime() - tzOffset);

    // แปลงเป็นรูปแบบที่ datetime-local ต้องการ (YYYY-MM-DDTHH:mm)
    const formattedDate = bangkokTime.toISOString().slice(0, 16);

    setFormData((prev) => ({ ...prev, dateTime: formattedDate }));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // สร้าง FormData เพื่อส่งไฟล์
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        data.append(key, value as any);
      }
    });

    console.log("Form submitted:", formData);
    // ตัวอย่างการส่งไป API
    // fetch("/api/report", { method: "POST", body: data });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg mx-auto p-6 bg-orange-50 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-orange-600 mb-6">
            🐾 ฟอร์มแจ้งพบสัตว์ไร้บ้าน
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ประเภทของสัตว์ */}
            <div>
              <label className="block font-semibold mb-1">คุณพบสัตว์อะไร</label>
              <select
                name="animalType"
                value={formData.animalType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">-- เลือกประเภทสัตว์ --</option>
                <option value="dog">สุนัข</option>
                <option value="cat">แมว</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>

            {/* ลักษณะของสัตว์ */}
            <div>
              <label className="block font-semibold mb-1">ลักษณะของสัตว์</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="เช่น ขนสีน้ำตาล มีปลอกคอสีแดง"
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>

            {/* พฤติกรรม */}
            <div>
              <label className="block font-semibold mb-1">
                พฤติกรรมที่สังเกตเห็น
              </label>
              <select
                name="behavior"
                value={formData.behavior}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">-- เลือกพฤติกรรม --</option>
                <option value="friendly">เชื่อง</option>
                <option value="aggressive">ดุร้าย</option>
                <option value="injured">บาดเจ็บ</option>
                <option value="wandering">เดินวน</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>

            {/* สถานที่ */}
            <div>
              <label className="block font-semibold mb-1">สถานที่พบสัตว์</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="ปักหมุดบนแผนที่หรือกรอกชื่อสถานที่"
                className="w-full border border-gray-300 rounded-lg p-2"
              />
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-yellow-200 rounded-lg text-sm"
              >
                📍 ปักหมุด
              </button>
            </div>

            {/* สถานะ */}
            <div>
              <label className="block font-semibold mb-1">
                สถานะปัจจุบันของสัตว์
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="ยังอยู่ในพื้นที่"
                    checked={formData.status === "ยังอยู่ในพื้นที่"}
                    onChange={handleChange}
                  />
                  ยังอยู่ในพื้นที่
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="ได้รับการช่วยเหลือแล้ว"
                    checked={formData.status === "ได้รับการช่วยเหลือแล้ว"}
                    onChange={handleChange}
                  />
                  ได้รับการช่วยเหลือแล้ว
                </label>
              </div>
            </div>

            {/* วันที่และเวลา */}
            <div>
              <label className="block font-semibold mb-1">
                วันที่และเวลาที่พบ
              </label>
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>

            {/* อัปโหลดรูปภาพ */}
            <div>
              <label className="block font-semibold mb-1">อัปโหลดรูปภาพ</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Animal Preview"
                  className="mt-3 w-full max-h-64 object-cover rounded-lg border"
                />
              )}
            </div>

            {/* ข้อมูลเพิ่มเติม */}
            <div>
              <label className="block font-semibold mb-1">
                ข้อมูลเพิ่มเติม (ถ้ามี)
              </label>
              <textarea
                name="moreInfo"
                value={formData.moreInfo}
                onChange={handleChange}
                placeholder="รายละเอียดอื่น ๆ ที่อยากบอก"
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>

            {/* ปุ่มส่ง */}
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition"
            >
              📤 ส่งรายงาน
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
