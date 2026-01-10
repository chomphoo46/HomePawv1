"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FaPaw,
  FaCheckCircle,
  FaTimesCircle,
  FaPhone,
  FaLine,
} from "react-icons/fa";
import { BiUser, BiTime } from "react-icons/bi";
import ExportButton from "@/app/components/ExportButton-request";

// Interface ให้ตรงกับข้อมูลที่ API ส่งมา
interface AdoptionRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  contact_info: string;
  note: string;
  created_at: string;
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
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, APPROVED

  // 1. ฟังก์ชันดึงข้อมูล (Call GET API)
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

  // 2. ฟังก์ชันอัปเดตสถานะ (Call PATCH API)
  const handleUpdateStatus = async (
    req: AdoptionRequest,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    const isApprove = newStatus === "APPROVED";

    // ถามยืนยันก่อน
    const result = await Swal.fire({
      title: isApprove ? "ยืนยันการอนุมัติ?" : "ยืนยันการปฏิเสธ?",
      text: isApprove
        ? `คุณต้องการอนุมัติให้คุณ ${req.user.name} รับเลี้ยงน้อง ${req.post.pet_name} ใช่ไหม?`
        : "คุณต้องการปฏิเสธคำขอนี้ใช่ไหม?",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#10B981" : "#EF4444",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/admin/adoption", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: req.id,
            postId: req.post.post_id,
            status: newStatus,
          }),
        });

        if (res.ok) {
          Swal.fire("สำเร็จ", "ดำเนินการเรียบร้อยแล้ว", "success");
          fetchRequests(); // ดึงข้อมูลใหม่เพื่ออัปเดตหน้าจอ
        } else {
          Swal.fire("ผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้", "error");
        }
      } catch (error) {
        Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
      }
    }
  };

  // Filter Logic
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        คำขอรับเลี้ยง
      </h1>

      {/* Tabs Filter */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "ALL"
              ? "bg-[#D4A373] text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "PENDING"
              ? "bg-orange-500 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          รอดำเนินการ
        </button>
        <button
          onClick={() => setFilter("APPROVED")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "APPROVED"
              ? "bg-green-600 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          อนุมัติแล้ว
        </button>
        <button
          onClick={() => setFilter("REJECTED")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "REJECTED"
              ? "bg-red-600  text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          ปฏิเสธแล้ว
        </button>
        
        <button className="ml-auto">
          <ExportButton />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#D4A373] text-md font-semibold">
            <tr>
              <th className="p-4">สัตว์เลี้ยง</th>
              <th className="p-4">ผู้ขอรับเลี้ยง</th>
              <th className="p-4">ข้อมูลติดต่อ / เหตุผล</th>
              <th className="p-4">วันที่ส่งคำขอ</th>
              <th className="p-4">สถานะ</th>
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
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {req.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {req.user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 3. ข้อมูลติดต่อ */}
                  <td className="p-4 max-w-xs">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-gray-700 font-medium">
                        {req.contact_info || "-"}
                      </p>
                      <p className="text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        "{req.note || "ไม่ได้ระบุเหตุผล"}"
                      </p>
                    </div>
                  </td>

                  {/* 4. วันที่ */}
                  <td className="p-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      {new Date(req.created_at).toLocaleDateString("th-TH")}
                    </div>
                    <div className="text-xs pl-5">
                      {new Date(req.created_at).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>

                  {/* 5. สถานะ */}
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
                      {req.status}
                    </span>
                  </td>

                  {/* 6. ปุ่มจัดการ */}
                  <td className="p-4 text-center">
                    {req.status === "PENDING" ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(req, "APPROVED")}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-bold shadow-sm transition-transform hover:scale-105"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req, "REJECTED")}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-bold shadow-sm transition-transform hover:scale-105"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        - ดำเนินการแล้ว -
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
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
