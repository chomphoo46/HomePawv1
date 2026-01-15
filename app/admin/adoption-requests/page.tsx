"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FaPaw,
  FaCheckCircle,
  FaTimesCircle,
  FaPhone,
  FaClock,
} from "react-icons/fa";
import ExportButton from "@/app/components/ExportButton-request";

// Interface
interface AdoptionRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  name: string;
  contact_info: string;
  note: string;
  created_at: string;
  reason?: string; // เหตุผลของ Admin
  user: {
    name: string;
    email: string;
  };
  post: {
    post_id: number;
    pet_name: string;
    images: { image_url: string; url?: string }[];
  };
}

export default function AdoptionRequestsPage() {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/adoption");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (
    req: AdoptionRequest,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    const isApprove = newStatus === "APPROVED";

    const { value: reason, isConfirmed } = await Swal.fire({
      title: isApprove ? "อนุมัติคำขอ" : "ปฏิเสธคำขอ",
      text: isApprove
        ? `ระบุเหตุผลในการอนุมัติคุณ ${req.name}`
        : `ระบุเหตุผลในการปฏิเสธคุณ ${req.name}`,
      input: "textarea",
      inputLabel: "เหตุผล / หมายเหตุ (บันทึกเข้าระบบ)",
      inputPlaceholder: isApprove
        ? "เช่น เอกสารครบถ้วน, บ้านผ่านเกณฑ์..."
        : "เช่น ที่อยู่ไม่ชัดเจน, ไม่พร้อมรับเลี้ยง...",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#10B981" : "#EF4444",
      confirmButtonText: isApprove ? "ยืนยันการอนุมัติ" : "ยืนยันการปฏิเสธ",
      cancelButtonText: "ยกเลิก",
    });

    if (isConfirmed) {
      try {
        Swal.fire({
          title: "กำลังบันทึก...",
          didOpen: () => Swal.showLoading(),
        });

        const res = await fetch("/api/admin/adoption", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: req.id,
            postId: req.post.post_id,
            status: newStatus,
            reason:
              reason ||
              (isApprove
                ? "อนุมัติโดยไม่มีหมายเหตุ"
                : "ปฏิเสธโดยไม่มีหมายเหตุ"),
          }),
        });

        if (res.ok) {
          await Swal.fire("สำเร็จ", "ดำเนินการเรียบร้อยแล้ว", "success");
          fetchRequests();
        } else {
          Swal.fire("ผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
        }
      } catch (error) {
        Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
      }
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
    );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">คำขอรับเลี้ยง</h1>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === f
                ? f === "PENDING"
                  ? "bg-orange-500 text-white"
                  : f === "APPROVED"
                  ? "bg-green-600 text-white"
                  : f === "REJECTED"
                  ? "bg-red-600 text-white"
                  : "bg-[#D4A373] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            } shadow-md`}
          >
            {f === "ALL"
              ? "ทั้งหมด"
              : f === "PENDING"
              ? "รอดำเนินการ"
              : f === "APPROVED"
              ? "อนุมัติแล้ว"
              : "ปฏิเสธแล้ว"}
          </button>
        ))}
        <div className="ml-auto">
          <ExportButton />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#D4A373] text-md font-semibold text-white">
            <tr>
              <th className="p-4">สัตว์เลี้ยง</th>
              <th className="p-4">ผู้ขอรับเลี้ยง</th>
              <th className="p-4">ข้อมูลติดต่อ (ผู้ขอ)</th>
              <th className="p-4">วันที่ส่งคำขอ</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 w-1/5">เหตุผล (แอดมิน)</th>
              <th className="p-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-orange-50/30 transition">
                  {/* 1. สัตว์เลี้ยง */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shadow-sm shrink-0">
                        {req.post.images && req.post.images[0] ? (
                          <img
                            src={
                              req.post.images[0].image_url ||
                              req.post.images[0].url
                            }
                            alt={req.post.pet_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaPaw />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {req.post.pet_name}
                      </span>
                    </div>
                  </td>

                  {/* 2. ผู้ขอ */}
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{req.name}</p>
                    <p className="text-xs text-gray-500">{req.user.email}</p>
                  </td>

                  {/* 3. ข้อมูลติดต่อ + Note ผู้ขอ */}
                  <td className="p-4 max-w-xs">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-gray-700 font-medium">
                        <FaPhone className="text-gray-400 text-xs" />{" "}
                        {req.contact_info || "-"}
                      </p>
                      <div className="text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 text-xs italic">
                        "{req.note || "ไม่มีข้อความเพิ่มเติม"}"
                      </div>
                    </div>
                  </td>

                  {/* 5. วันที่ */}
                  <td className="p-4 text-gray-500">
                    <div className="flex flex-col">
                      <span>
                        {new Date(req.created_at).toLocaleDateString("th-TH")}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(req.created_at).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>

                  {/* 6. สถานะ */}
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        req.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : req.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : req.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {req.status === "APPROVED" && <FaCheckCircle />}
                      {req.status === "REJECTED" && <FaTimesCircle />}
                      {req.status === "PENDING" && <FaClock />}
                      {req.status}
                    </span>
                  </td>
                  {/* 4. เหตุผลแอดมิน (แยกคอลัมน์มาแล้ว) */}
                  <td className="p-4">
                    {req.status === "PENDING" ? (
                      <span className="text-gray-300 text-xs">
                        - รอการพิจารณา -
                      </span>
                    ) : (
                      <div
                        className={`p-2 rounded text-xs border ${
                          req.status === "APPROVED"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        {req.reason || "- ไม่ระบุเหตุผล -"}
                      </div>
                    )}
                  </td>
                  {/* 7. ปุ่มจัดการ */}
                  <td className="p-4 text-center">
                    {req.status === "PENDING" ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(req, "APPROVED")}
                          className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs shadow-sm"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req, "REJECTED")}
                          className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs shadow-sm"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">- ปิดเคส -</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  <div className="flex flex-col items-center">
                    <FaPaw className="text-4xl text-gray-200 mb-2" />
                    ไม่มีคำขอรับเลี้ยงในสถานะนี้
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
