"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaTrash, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
interface Member {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [loading, setLoading] = useState(false);
  const { update, data: session } = useSession();

  // โหลดข้อมูลสมาชิกทั้งหมด
  const fetchMembers = async () => {
    const res = await fetch("/api/admin/members");
    const data = await res.json();
    setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // บันทึกชื่อที่แก้ไข
  const handleSave = async (user_id: string) => {
    setLoading(true);
    await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, name: editedName }),
    });
    // ถ้าแก้ชื่อ "ตัวเอง" อยู่ → refresh session
    if (session?.user?.id === user_id) {
      await update({ name: editedName });
    }
    setEditingId(null);
    setEditedName("");
    await fetchMembers();
    setLoading(false);
  };

  // ลบสมาชิก
  const handleDelete = async (user_id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกนี้?")) return;
    setLoading(true);
    await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });
    await fetchMembers();
    setLoading(false);
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-semibold mb-6">จัดการสมาชิก</h1>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-[#D4A373] text-left ">
            <tr>
              <th className="py-3 px-4">ชื่อสมาชิก</th>
              <th className="py-3 px-4">อีเมล</th>
              <th className="py-3 px-4">บทบาท</th>
              <th className="py-3 px-4">วันที่สร้าง</th>
              <th className="py-3 px-4 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  {editingId === m.user_id ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    m.name
                  )}
                </td>
                <td className="py-3 px-4">{m.email}</td>
                <td className="py-3 px-4 capitalize">{m.role}</td>
                <td className="py-3 px-4">
                  {new Date(m.created_at).toLocaleDateString("th-TH")}
                </td>
                <td className="py-3 px-4 flex justify-center gap-3">
                  {editingId === m.user_id ? (
                    <>
                      <button
                        onClick={() => handleSave(m.user_id)}
                        className="bg-white p-2 rounded-full shadow hover:bg-green-50 hover:text-green-600 transition disabled:opacity-50"
                        disabled={loading}
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditedName("");
                        }}
                        className="bg-white p-2 rounded-full shadow hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                      >
                        <FaTimes />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(m.user_id);
                          setEditedName(m.name);
                        }}
                        className="bg-white p-2 rounded-full shadow hover:bg-green-50 hover:text-green-600 transition disabled:opacity-50"
                      >
                        <MdModeEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.user_id)}
                        className="bg-white p-2 rounded-full shadow hover:bg-red-50 hover:text-red-600 transition"
                        disabled={loading}
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 mt-4">กำลังดำเนินการ...</p>
      )}
    </div>
  );
}
