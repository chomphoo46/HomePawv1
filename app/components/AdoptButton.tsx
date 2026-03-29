"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface AdoptButtonProps {
  postId: number;
  petName: string;
  currentUserId?: string | null; // id ของผู้ใช้ที่ล็อกอินอยู่
  ownerUserId: string; // id ของเจ้าของโพสต์
  status: string; // สถานะของโพสต์ เช่น AVAILABLE / ADOPTED
}

export default function AdoptButton({
  postId,
  petName,
  currentUserId,
  ownerUserId,
  status,
}: AdoptButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // เช็กว่าน้องได้บ้านแล้วหรือยัง
  const isAdopted = status === "ADOPTED";

  // เช็กว่าเป็นโพสต์ของผู้ใช้คนปัจจุบันหรือไม่
  const isOwnPost = currentUserId === ownerUserId;

  const handleAdoptClick = async () => {
    // ถ้าปุ่มอยู่ในสถานะห้ามกด ให้หยุดการทำงานทันที
    if (isAdopted || isOwnPost || isLoading) return;

    // ตรวจสอบว่า login หรือยัง
    if (!currentUserId) {
      Swal.fire({
        title: "กรุณาเข้าสู่ระบบ",
        text: "คุณต้องเข้าสู่ระบบก่อนกดขอรับเลี้ยง",
        icon: "warning",
        confirmButtonColor: "#D4A373",
        confirmButtonText: "ไปหน้าเข้าสู่ระบบ",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/login");
        }
      });
      return;
    }

    // ตรวจสอบว่าเป็นเจ้าของโพสต์หรือไม่
    if (isOwnPost) {
      Swal.fire({
        title: "ไม่สามารถทำรายการได้",
        text: "คุณไม่สามารถส่งคำขอรับเลี้ยงสัตว์ของตัวเองได้",
        icon: "warning",
        confirmButtonColor: "#EF4444",
      });
      return;
    }

    // แสดง popup ให้กรอกข้อมูลการขอรับเลี้ยง
    const { value: formValues } = await Swal.fire({
      title: `สนใจรับเลี้ยงน้อง ${petName}?`,
      html:
        '<div class="text-left">' +
        '<label class="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ขอ</label>' +
        `<input id="swal-name" class="swal2-input m-0! w-full! mb-4!" placeholder="ชื่อของคุณ">` +
        '<label class="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ติดต่อกลับ *</label>' +
        '<input id="swal-contact" class="swal2-input m-0! w-full! mb-4!" placeholder="08x-xxx-xxxx">' +
        '<label class="block text-sm font-medium text-gray-700 mb-1">ข้อความเพิ่มเติมถึงเจ้าของ (ถ้ามี)</label>' +
        '<textarea id="swal-note" class="swal2-textarea m-0! w-full!" placeholder="เช่น ความพร้อมในการเลี้ยง, เคยเลี้ยงสัตว์มาก่อนไหม"></textarea>' +
        "</div>",
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "ยืนยันส่งคำขอ",
      confirmButtonColor: "#D4A373",
      cancelButtonText: "ยกเลิก",
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const contact = (
          document.getElementById("swal-contact") as HTMLInputElement
        ).value;
        const note = (
          document.getElementById("swal-note") as HTMLTextAreaElement
        ).value;

        // ตรวจสอบข้อมูลบังคับ
        if (!contact) {
          Swal.showValidationMessage("กรุณากรอกเบอร์โทรศัพท์");
          return false;
        }

        return { name, contact, note };
      },
    });

    // ถ้าผู้ใช้กดยืนยันและกรอกข้อมูลผ่าน validation แล้ว
    if (formValues) {
      try {
        setIsLoading(true);

        // ส่งคำขอไปยัง backend
        const response = await fetch("/api/adopt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: postId,
            name: formValues.name,
            contactInfo: formValues.contact,
            note: formValues.note,
          }),
        });

        const data = await response.json();

        // กรณีส่งสำเร็จ
        if (response.ok) {
          Swal.fire({
            title: "ส่งคำขอสำเร็จ",
            text: "เราได้รับคำขอของคุณแล้ว และจะติดต่อกลับไปหาคุณค่ะ",
            icon: "success",
            confirmButtonColor: "#10B981",
          });
        } else {
          // กรณี backend ตอบ error กลับมา
          Swal.fire({
            title: "แจ้งเตือน",
            text: data.message || "เกิดข้อผิดพลาด",
            icon: "warning",
            confirmButtonColor: "#EF4444",
          });
        }
      } catch (error) {
        console.error(error);

        // กรณีเชื่อมต่อ server ไม่ได้
        Swal.fire({
          title: "Error",
          text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
          icon: "error",
          confirmButtonColor: "#EF4444",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleAdoptClick}
      disabled={isLoading || isAdopted || isOwnPost}
      className={`flex-1 font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md
        ${
          isAdopted || isOwnPost
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : isLoading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-[#D4A373] hover:bg-[#B8956A] hover:shadow-lg text-white"
        }`}
    >
      {isAdopted
        ? "น้องได้บ้านแล้ว"
        : isOwnPost
        ? "นี่คือโพสต์ของคุณ"
        : isLoading
        ? "กำลังส่งข้อมูล..."
        : "สนใจรับเลี้ยง"}
    </button>
  );
}