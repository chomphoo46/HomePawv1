"use client";

import { useEffect, useState } from "react";
import { FaPaw, FaTrash } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { Eye } from "lucide-react";

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
  pet_name: string;
  phone: string;
  gene: string;
  age: string;
  sex: string;
  VaccinationStatus: string;
  NeuteredStatus: string;
  address: string;
  contact: string;
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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
          <thead className="bg-[#D4A373] text-left">
            <tr>
              <th className="p-4">รูปภาพ</th>
              <th className="p-4">ประเภท</th>
              <th className="p-4">รายละเอียด</th>
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
                className="hover:bg-gray-50 transition"
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

                <td className="p-4">
                  {post.type === "report" ? "แจ้งพบสัตว์" : "หาบ้านให้สัตว์"}
                </td>
                <td className="p-4">{post.title}</td>

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
                  {/* ✅ ปุ่มดูรายละเอียด */}
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="p-2 rounded-full shadow hover:bg-blue-50 hover:text-blue-600 transition bg-white"
                  >
                    <Eye size={18} />
                  </button>

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
      {/* ✅ Modal แสดงรายละเอียดโพสต์ */}
      {selectedPost && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header with gradient */}
            <div className="relative h-32 w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                <span className="text-gray-700 text-xl">✕</span>
              </button>

              {/* Type badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                <span className="text-lg">
                  {selectedPost.type === "report" ? "🔍" : "🏠"}
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {selectedPost.type === "report"
                    ? "แจ้งพบสัตว์"
                    : "หาบ้านให้สัตว์"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 -mt-16">
              {/* Pet Image */}
              <div className="flex justify-center mb-6">
                {getPostImageUrl(selectedPost) ? (
                  <div className="relative">
                    <img
                      src={getPostImageUrl(selectedPost)!}
                      alt="animal"
                      className="w-36 h-36 object-cover rounded-2xl shadow-2xl border-4 border-white transition-transform hover:scale-105"
                    />
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <FaPaw className="text-orange-400 text-xl" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-36 h-36 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center rounded-2xl shadow-2xl border-4 border-white transition-transform hover:scale-105">
                      <FaPaw className="text-orange-400 text-6xl" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xl">🐾</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pet Name */}
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {selectedPost.pet_name}
                </h2>
                <span className="inline-block px-5 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700 border border-amber-300 shadow-sm">
                  {selectedPost.status}
                </span>
              </div>

              {/* Details Grid */}
              <div className="space-y-3 mb-6">
                {[
                  {
                    icon: "📍",
                    label: "ที่อยู่",
                    value: selectedPost.address,
                    bg: "bg-red-50",
                    color: "text-red-600",
                  },
                  {
                    icon: "🧬",
                    label: "สายพันธุ์",
                    value: selectedPost.gene,
                    bg: "bg-purple-50",
                    color: "text-purple-600",
                  },
                  {
                    icon: "⚥",
                    label: "เพศ",
                    value: selectedPost.sex,
                    bg: "bg-pink-50",
                    color: "text-pink-600",
                  },
                  {
                    icon: "🎂",
                    label: "อายุ",
                    value: selectedPost.age,
                    bg: "bg-yellow-50",
                    color: "text-yellow-600",
                  },
                  {
                    icon: "📞",
                    label: "เบอร์โทร",
                    value: selectedPost.phone,
                    bg: "bg-green-50",
                    color: "text-green-600",
                  },
                  {
                    icon: "💬",
                    label: "ช่องทางติดต่ออื่นๆ",
                    value: selectedPost.contact,
                    bg: "bg-indigo-50",
                    color: "text-indigo-600",
                  },
                  {
                    icon: "👤",
                    label: "ผู้โพสต์",
                    value: selectedPost.user?.name || "ไม่ทราบชื่อ",
                    bg: "bg-blue-50",
                    color: "text-blue-600",
                  },
                  {
                    icon: "📅",
                    label: "วันที่โพสต์",
                    value: new Date(selectedPost.createdAt).toLocaleDateString(
                      "th-TH"
                    ),
                    bg: "bg-teal-50",
                    color: "text-teal-600",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 ${item.bg} rounded-xl hover:bg-opacity-80 transition`}
                  >
                    <div
                      className={`w-10 h-10 ${item.bg} rounded-full flex items-center justify-center flex-shrink-0`}
                    >
                      <span className={`${item.color} text-sm`}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {selectedPost.title && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100 shadow-inner">
                  <p className="text-xs text-orange-600 font-semibold mb-2 uppercase tracking-wide">
                    รายละเอียด
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedPost.title}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
