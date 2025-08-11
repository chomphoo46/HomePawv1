"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const initialForm = {
  pet_name: "",
  type: "",
  age: "",
  health_status: "",
  reason: "",
  phone: "",
  images: [] as File[],
};

export default function FormRehomingPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({ dateTime: "" });
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setForm((prev) => ({
        ...prev,
        images: Array.from(e.target.files as FileList),
      }));
    }
  };
  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const bangkokTime = new Date(now.getTime() - tzOffset);
    const formattedDate = bangkokTime.toISOString().slice(0, 16);

    setFormData((prev) => ({ ...prev, dateTime: formattedDate }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // ส่งข้อมูลแบบ multipart/form-data
      const data = new FormData();
      data.append("user_id", "1");
      data.append("pet_name", form.pet_name);
      data.append("type", form.type);
      data.append("age", form.age);
      data.append("health_status", form.health_status);
      data.append("reason", form.reason);
      data.append("phone", form.phone);
      form.images.forEach((file) => data.append("images", file));

      const res = await fetch("/api/rehoming-report", {
        method: "POST",
        body: data,
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
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        แจ้งหาบ้านให้สัตว์เลี้ยง
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white p-6 rounded-xl shadow"
      >
        <div>
          <label className="block mb-1 font-medium">ชื่อสัตว์เลี้ยง</label>
          <input
            type="text"
            name="pet_name"
            className="w-full border rounded px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
            value={form.pet_name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">สายพันธุ์/ประเภท</label>
          <input
            type="text"
            name="type"
            className="w-full border rounded px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
            value={form.type}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">อายุ</label>
          <input
            type="text"
            name="age"
            className="w-full border rounded px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
            value={form.age}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">สถานะสุขภาพ</label>
          <select
            name="health_status"
            className="w-full border rounded px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
            value={form.health_status}
            onChange={handleChange}
            required
          >
            <option value="">เลือกสถานะ</option>
            <option value="VACCINATED">ฉีดวัดซีนแล้ว</option>
            <option value="NOT_VACCINATED">ยังไม่ได้ฉีดวัคซีน</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">เหตุผลที่หาบ้านใหม่</label>
          <textarea
            name="reason"
            className="w-full border rounded px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
            value={form.reason}
            onChange={handleChange}
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">เบอร์โทรติดต่อ</label>
          <input
            type="text"
            name="phone"
            className="w-full border rounded px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>
        {/* วันที่และเวลา */}
        <div>
          <label className="block font-semibold mb-1">วันที่และเวลาที่พบ</label>
          <input
            type="datetime-local"
            name="dateTime"
            value={formData.dateTime}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">
            อัปโหลดรูปภาพ (เลือกได้หลายไฟล์)
          </label>
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full"
          />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">ส่งข้อมูลสำเร็จ!</div>}
        <button
          type="submit"
          className="w-full bg-[#D4A373] hover:bg-[#b98b5e] text-white font-semibold py-2 rounded"
          disabled={submitting}
        >
          {submitting ? "กำลังส่ง..." : "ส่งข้อมูล"}
        </button>
      </form>
    </div>
  );
}
