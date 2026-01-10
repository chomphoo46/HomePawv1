"use client";
import { useState } from "react";
import { FaFileDownload } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function ExportRequestsButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. ดึงข้อมูลคำขอรับเลี้ยง (Adoption Requests)
      const res = await fetch("/api/admin/adoption");
      const data = await res.json();

      if (!data || data.length === 0) {
        alert("ไม่พบข้อมูลคำขอในระบบ");
        setIsExporting(false);
        return;
      }

      // 2. จัดเตรียมข้อมูล (Mapping) ให้ตรงกับ AdoptionRequest Schema
      const excelData = data.map((r: any) => {
        // สถานะภาษาไทย
        const statusMap: Record<string, string> = {
          PENDING: "รอตรวจสอบ",
          APPROVED: "อนุมัติแล้ว",
          REJECTED: "ปฏิเสธ",
          CANCELLED: "ยกเลิก",
        };

        return {
          "ID คำขอ": r.id,
          "ชื่อสัตว์": r.post?.pet_name || "ไม่ระบุ", // ชื่อสัตว์จาก post
          "ผู้ขอรับเลี้ยง": r.user?.name || "ไม่ระบุ", // ชื่อคนขอจาก user
          "ข้อมูลติดต่อ": r.contact_info || "-",      // เบอร์โทร/Line ที่กรอกมา
          "เหตุผล/หมายเหตุ": r.note || "-",           // เหตุผลที่กรอกมา
          "สถานะ": statusMap[r.status] || r.status,   // แปลงสถานะเป็นไทย
          "วันที่ส่งคำขอ": new Date(r.created_at).toLocaleDateString("th-TH"),
          "เวลา": new Date(r.created_at).toLocaleTimeString("th-TH"),
        };
      });

      // 3. สร้าง Worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // ปรับความกว้างคอลัมน์
      const columnWidths = [
        { wch: 10 }, // ID คำขอ
        { wch: 20 }, // ชื่อสัตว์
        { wch: 20 }, // ผู้ขอรับเลี้ยง
        { wch: 25 }, // ข้อมูลติดต่อ
        { wch: 30 }, // เหตุผล
        { wch: 15 }, // สถานะ
        { wch: 15 }, // วันที่
        { wch: 10 }, // เวลา
      ];
      worksheet["!cols"] = columnWidths;

      // 4. สร้าง Workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "AdoptionRequests");

      // 5. ดาวน์โหลด
      XLSX.writeFile(
        workbook,
        `รายงานคำขอรับเลี้ยง_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting requests:", error);
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูลคำขอ");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-[#1D6F42] border border-gray-200 shadow-sm transition-all disabled:opacity-50 text-sm font-medium hover:text-white text-gray-700"
    >
      <FaFileDownload />
      {isExporting ? "กำลังสร้างไฟล์ Excel..." : "Export คำขอรับเลี้ยง"}
    </button>
  );
}