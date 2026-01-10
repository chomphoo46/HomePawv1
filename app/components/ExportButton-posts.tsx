"use client";

import { useState } from "react";
import { FaFileDownload } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 2. ดึงข้อมูลโพสต์ทั้งหมด
      const res = await fetch("/api/admin/posts");
      const data = await res.json();

      if (!data || data.length === 0) {
        alert("ไม่พบข้อมูลโพสต์ในระบบ");
        setIsExporting(false);
        return;
      }

      // 3. จัดเตรียมข้อมูล (Mapping) ให้เป็น Format ที่ต้องการแสดงใน Excel
      // คีย์ของ Object จะกลายเป็น "หัวตาราง" (Header) โดยอัตโนมัติ
      const excelData = data.map((p: any) => {
        // จัดการ Mapping ข้อมูลที่ชื่อ Field ต่างกัน
        const isPet = p.type === "pet";

        return {
          ID: p.id,
          ประเภท: isPet ? "สัตว์หาบ้าน" : "แจ้งพบสัตว์",
          ชื่อสัตว์: isPet ? p.pet_name : p.title || p.description,
          สายพันธุ์: isPet ? p.gene : p.behavior || p.gene,
          สถานะ: p.status,
          ผู้โพสต์: p.user?.name || "ไม่ระบุ",
          เบอร์โทร: p.phone || "-",
          "ที่อยู่ / พิกัด": p.address || p.location || "-",
          วันที่สร้าง: new Date(p.createdAt).toLocaleDateString("th-TH"),
          เวลา: new Date(p.createdAt).toLocaleTimeString("th-TH"),
        };
      });

      // 4. สร้าง Worksheet จากข้อมูล JSON
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // (Optional) ปรับความกว้างคอลัมน์นิดหน่อยเพื่อให้สวยงาม
      const columnWidths = [
        { wch: 5 }, // ID
        { wch: 15 }, // ประเภท
        { wch: 20 }, // ชื่อสัตว์
        { wch: 20 }, // รายละเอียด
        { wch: 15 }, // สถานะ
        { wch: 20 }, // ผู้โพสต์
        { wch: 15 }, // เบอร์โทร
        { wch: 30 }, // ที่อยู่
        { wch: 15 }, // วันที่
        { wch: 10 }, // เวลา
      ];
      worksheet["!cols"] = columnWidths;

      // 5. สร้าง Workbook และใส่ Worksheet ลงไป
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ReportData");

      // 6. สั่งดาวน์โหลดเป็นไฟล์ .xlsx
      XLSX.writeFile(
        workbook,
        `รายงานโพสต์ทั้งหมด_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Export failed", error);
      alert("เกิดข้อผิดพลาดในการ Export");
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
      {isExporting ? "กำลังสร้างไฟล์ Excel..." : "Export โพสต์ทั้งหมด"}
    </button>
  );
}
