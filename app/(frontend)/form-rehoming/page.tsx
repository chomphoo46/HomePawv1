"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/app/components/Header";
import { HiPhoto } from "react-icons/hi2";


const initialForm = {
  pet_name: "",
  type: "",
  sex: "",
  age: "",
  health_status: "",
  reason: "",
  phone: "",
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
    return <div className="text-center py-10">กำลังตรวจสอบสิทธิ์...</div>;
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
      data.append("health_status", form.health_status);
      data.append("reason", form.reason);
      data.append("phone", form.phone);
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          แจ้งหาบ้านให้สัตว์เลี้ยง
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-orange-50 rounded-xl shadow-md p-10 w-100 max-w-md space-y-6"
        >
          <div>
            <label className="block mb-1 font-medium">ชื่อสัตว์เลี้ยง</label>
            <input
              type="text"
              name="pet_name"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
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
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373] bg-white"
              value={form.type}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">เพศ</label>
            <select
              name="sex"
              className="w-full border rounded-lg bg-white px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
              value={form.sex}
              onChange={handleChange}
              required
            >
              <option value="">เลือกเพศ</option>
              <option value="MALE">เพศผู้</option>
              <option value="FEMALE">เพศเมีย</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">อายุ</label>
            <input
              type="text"
              name="age"
              className="w-full border rounded-lg bg-white px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
              value={form.age}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">สถานะสุขภาพ</label>
            <select
              name="health_status"
              className="w-full border rounded-lg bg-white px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
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
            <label className="block mb-1 font-medium">
              เหตุผลที่หาบ้านใหม่
            </label>
            <textarea
              name="reason"
              className="w-full border rounded-lg bg-white px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
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
              className="w-full border rounded-lg bg-white px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              วันที่และเวลาที่แจ้ง
            </label>
            <input
              type="datetime-local"
              name="dateTime"
              value={formData.dateTime}
              onChange={handleChange}
              className="w-full border rounded-lg bg-white px-3 py-2 outline-none focus:border-2 focus:border-[#D4A373]"
            />
          </div>

          <div className="w-full">
            <label className="block  mb-2">
              อัปโหลดรูปภาพ
            </label>
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-center border-2 border-dashed border-gray-300 rounded-xl p-6 block transition-all hover:border-[#D4A373]  bg-white"
            >
              {previewUrl ? (
                <div className="flex flex-col items-center bg-white p-2 rounded-lg shadow">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-40 object-cover rounded-lg"
                  />
                  <p className="mt-1 text-xs text-gray-600 truncate w-full text-center">
                    {fileName}
                  </p>
                </div>
              ) : (
                <>
                  <HiPhoto
                    aria-hidden="true"
                    className="mx-auto w-12 h-12 text-gray-300"
                  />
                  <div className="mt-4 flex text-sm  justify-center">
                    <span className="font-semibold  hover:text-[#D4A373]">
                      คลิกเพื่ออัปโหลด
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF สูงสุด 10MB
                  </p>
                </>
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
    </div>
  );
}
