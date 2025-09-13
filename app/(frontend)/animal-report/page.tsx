"use client";

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import { HiPhoto } from "react-icons/hi2";

export default function ReportForm() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
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

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const bangkokTime = new Date(now.getTime() - tzOffset);
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
      setFileName(file.name);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        data.append(key, value as any);
      }
    });

    console.log("Form submitted:", formData);
    // fetch("/api/report", { method: "POST", body: data });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-[#D4A373] mb-6">
          แจ้งพบสัตว์ไร้บ้าน
        </h2>
        <div className="bg-orange-50 rounded-xl shadow-md p-10 w-110 max-w-md space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ประเภทของสัตว์ */}
            <div>
              <label className="block font-semibold mb-1">คุณพบสัตว์อะไร</label>
              <select
                name="animalType"
                value={formData.animalType}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
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
                className="w-full border rounded-lg p-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
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
                className="w-full border rounded-lg p-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
              >
                <option value="">-- เลือกพฤติกรรม --</option>
                <option value="friendly">เชื่อง</option>
                <option value="aggressive">ดุร้าย</option>
                <option value="injured">บาดเจ็บ</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </div>

            {/* สถานะ */}
            <div>
              <label className="block font-semibold mb-1">สถานะของสัตว์</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
              >
                <option value="">-- เลือกสถานะ --</option>
                <option value="friendly">ยังอยู่ที่เดิม</option>
                <option value="aggressive">ได้รับการช่วยเหลือแล้ว</option>
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
                className="w-full border rounded-lg p-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
              />
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-yellow-200 rounded-lg text-sm"
              >
                📍 ปักหมุด
              </button>
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
                className="w-full border rounded-lg p-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
              />
            </div>

            {/* อัปโหลดภาพสัตว์ */}
            <label htmlFor="file-upload" className="block font-semibold mb-1">
              อัปโหลดรูปภาพ
            </label>

            {/* กล่องที่กดได้ทั้งหมด */}
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-center border-2 border-dashed border-gray-300 rounded-xl p-6 block transition-all hover:border-[#D4A373]  bg-white"
            >
              {previewUrl ? (
                <div>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mx-auto max-h-64 object-contain rounded-lg"
                  />
                  {fileName && (
                    <p className="mt-2 text-sm text-gray-700">{fileName}</p>
                  )}
                </div>
              ) : (
                <>
                  <HiPhoto
                    aria-hidden="true"
                    className="mx-auto size-12 text-gray-300"
                  />
                  <div className="mt-4 flex text-sm justify-center">
                    <span className="font-semibold  hover:text-[#D4A373]">
                      คลิกเพื่ออัปโหลด
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    PNG, JPG, GIF สูงสุด 10MB
                  </p>
                </>
              )}
            </label>

            {/* input ที่ซ่อน */}
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPreviewUrl(URL.createObjectURL(file));
                  setFileName(file.name);
                }
              }}
              className="sr-only"
            />

            {/* ปุ่มส่ง */}
            <button
              type="submit"
              className="w-full bg-[#D4A373] hover:bg-[#b98b5e] text-white font-semibold py-2 rounded-lg"
            >
              ส่งรายงาน
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
