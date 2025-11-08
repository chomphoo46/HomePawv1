"use client";

import { useEffect, useState } from "react";
import { FaPaw, FaTrash } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";

interface Image {
  id: number;
  url: string;
}

interface User {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string; // หัวข้อ/รายละเอียด
  type: "report" | "pet"; // ประเภทโพสต์
  status: string; // สถานะ
  user: User; // ผู้โพสต์
  createdAt: string; // วันที่สร้างโพสต์ (เป็น string ISO)
  images: Image[]; // รายการรูปภาพ
}

export default function ManagePostsPage() {
  const [posts, setPosts] = useState<Post[]>([]); // สถานะสำหรับเก็บโพสต์
  const [loading, setLoading] = useState(true); // สถานะกำลังโหลด

  // ฟังก์ชันช่วย: เลือกรูปภาพแรกของโพสต์
  const getPostImageUrl = (post: Post) => {
    if (post.images && post.images.length > 0) {
      const url = post.images[0].url;
      if (!url) return null;
      // เนื่องจาก API ได้ normalize URL แล้ว จึงใช้ URL ได้โดยตรง
      return url;
    }
    return null;
  };

  // ดึงข้อมูลโพสต์จาก API
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err); // ข้อผิดพลาดในการดึงโพสต์
    } finally {
      setLoading(false);
    }
  };

  // จัดการการลบโพสต์
  const handleDelete = async (id: number, type: string) => {
    if (!confirm("ต้องการลบโพสต์นี้หรือไม่?")) return;

    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }), // ส่ง id และ type ไป
      });

      const result = await res.json();

      if (res.ok || result.success) {
        alert(result.message || "ลบสำเร็จ");
        fetchPosts(); // ดึงข้อมูลใหม่
      } else {
        alert(result.error || "ลบไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Error deleting post:", err); // ข้อผิดพลาดในการลบโพสต์
      alert("เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <p className="p-6 text-gray-500">กำลังโหลดข้อมูล...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6">จัดการโพสต์</h1>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-[#FEFAE0] text-left">
            <tr>
              <th className="p-4">รูปภาพ</th>
              <th className="p-4">รายละเอียด</th>
              <th className="p-4">ประเภท</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4">ผู้โพสต์</th>
              <th className="p-4">วันที่</th>
              <th className="p-4 text-center">การจัดการ</th>
            </tr>
          </thead>

          <tbody>
            {posts.map((post) => (
              <tr
                // ใช้ post.id ที่ normalize แล้วเป็น key
                key={String(post.id) ?? `${post.title}-${post.createdAt}`}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-4">
                  {getPostImageUrl(post) ? (
                    <img
                      src={getPostImageUrl(post)!}
                      alt="animal"
                      className="w-14 h-14 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 flex items-center justify-center rounded-xl">
                      <FaPaw className="text-gray-400 text-2xl" />
                    </div>
                  )}
                </td>

                <td className="p-4">{post.title}</td>
                <td className="p-4">
                  {post.type === "report" ? "แจ้งพบสัตว์" : "หาบ้านให้สัตว์"}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      post.status === "Adopted" || post.status === "ADOPTED"
                        ? "bg-green-100 text-green-700"
                        : post.status === "AVAILABLE" ||
                          post.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {post.status}
                  </span>
                </td>

                {/* แสดงชื่อ หรือ username (ถ้ามี) */}
                <td className="p-4">{post.user?.name || "ไม่ทราบชื่อ"}</td>
                <td className="p-4">
                  {/* แปลงวันที่ และตรวจสอบ Invalid Date */}
                  {post.createdAt &&
                  new Date(post.createdAt).toString() !== "Invalid Date"
                    ? new Date(post.createdAt).toLocaleDateString("th-TH")
                    : "ไม่ระบุวันที่"}
                </td>

                <td className="p-4 flex items-center justify-center gap-3">
                  <button className="bg-white p-2 rounded-full shadow  hover:bg-green-50 hover:text-green-600 transition">
                    <MdModeEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id, post.type)}
                    className="bg-white p-2 rounded-full shadow hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts.length === 0 && (
          <p className="text-center py-10 text-gray-500">ไม่พบโพสต์ในระบบ</p>
        )}
      </div>
    </div>
  );
}
