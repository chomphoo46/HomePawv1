"use client"; // บรรทัดนี้สำคัญมาก เพื่อบอกว่าเป็น Client Component

import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface AdoptButtonProps {
  postId: number;
  petName: string;
  currentUserId?: string | null; // รับ ID ของคนที่ Login อยู่
}

export default function AdoptButton({ postId, petName, currentUserId }: AdoptButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAdoptClick = async () => {
    // 1. เช็คว่า Login หรือยัง
    if (!currentUserId) {
      Swal.fire({
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'คุณต้องเข้าสู่ระบบก่อนกดขอรับเลี้ยง',
        icon: 'warning',
        confirmButtonColor: '#D4A373',
        confirmButtonText: 'ไปหน้าเข้าสู่ระบบ'
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/login'); // เปลี่ยนเป็น path login ของคุณ
        }
      });
      return;
    }

    // 2. Pop-up กรอกข้อมูล (SweetAlert2)
    const { value: formValues } = await Swal.fire({
      title: `สนใจรับเลี้ยงน้อง ${petName}?`,
      html:
        '<div class="text-left">' +
        '<label class="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ติดต่อกลับ *</label>' +
        '<input id="swal-contact" class="swal2-input m-0! w-full! mb-4!" placeholder="08x-xxx-xxxx">' +
        '<label class="block text-sm font-medium text-gray-700 mb-1">ข้อความเพิ่มเติมถึงเจ้าของ (ถ้ามี)</label>' +
        '<textarea id="swal-note" class="swal2-textarea m-0! w-full!" placeholder="เช่น ความพร้อมในการเลี้ยง, เคยเลี้ยงสัตว์มาก่อนไหม"></textarea>' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันส่งคำขอ',
      confirmButtonColor: '#D4A373',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const contact = (document.getElementById('swal-contact') as HTMLInputElement).value;
        const note = (document.getElementById('swal-note') as HTMLTextAreaElement).value;
        
        if (!contact) {
          Swal.showValidationMessage('กรุณากรอกเบอร์โทรศัพท์');
          return false;
        }
        return { contact, note };
      }
    });

    // 3. ยิง API เมื่อกดยืนยัน
    if (formValues) {
      try {
        setIsLoading(true);

        const response = await fetch('/api/adopt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            postId: postId,
            contactInfo: formValues.contact,
            note: formValues.note
          }),
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            title: 'ส่งคำขอสำเร็จ!',
            text: 'เจ้าของโพสต์จะได้รับการแจ้งเตือน และจะติดต่อกลับไปหาคุณครับ',
            icon: 'success',
            confirmButtonColor: '#10B981'
          });
        } else {
          // กรณี Error (เช่น เคยส่งไปแล้ว หรือ น้องได้บ้านแล้ว)
          Swal.fire({
            title: 'แจ้งเตือน',
            text: data.message || 'เกิดข้อผิดพลาด',
            icon: 'warning',
            confirmButtonColor: '#EF4444'
          });
        }

      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleAdoptClick}
      disabled={isLoading}
      className={`flex-1 font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md 
        ${isLoading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-[#D4A373] hover:bg-[#B8956A] hover:shadow-lg text-white'
        }`}
    >
      {isLoading ? 'กำลังส่งข้อมูล...' : 'สนใจรับเลี้ยง'}
    </button>
  );
}