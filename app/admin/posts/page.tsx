"use client";

import { JSX } from "react";
import { useEffect, useState } from "react";
import { FaPaw, FaTrash } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { Eye } from "lucide-react";
import { FaMars, FaVenus, FaGenderless, FaTimesCircle } from "react-icons/fa";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { RiContactsBook3Line } from "react-icons/ri";
import { BiUser } from "react-icons/bi";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import { FaCircleCheck } from "react-icons/fa6";

// Map สถานะวัคซีน
const healthStatusIcons: Record<string, { label: string; icon: JSX.Element }> =
  {
    VACCINATED: {
      label: "ฉีดวัคซีนแล้ว",
      icon: <FaCircleCheck className="text-green-500 text-xl" />,
    },
    NOT_VACCINATED: {
      label: "ยังไม่ได้ฉีดวัคซีน",
      icon: <FaTimesCircle className="text-red-500 text-xl" />,
    },
  };

// Map สถานะทำหมัน
const neuteredStatusIcons: Record<
  string,
  { label: string; icon: JSX.Element }
> = {
  NEUTERED: {
    label: "ทำหมันแล้ว",
    icon: <FaCircleCheck className="text-green-500 text-xl" />,
  },
  NOT_NEUTERED: {
    label: "ยังไม่ได้ทำหมัน",
    icon: <FaTimesCircle className="text-red-500 text-xl" />,
  },
};

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
  vaccinationStatus: { code: string; label?: string };
  neuteredStatus: { code: string; label?: string };
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
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // แปลงเพศเป็นภาษาไทย
  const getSexLabel = (sex: string) => {
    switch (sex) {
      case "MALE":
        return "ผู้";
      case "FEMALE":
        return "เมีย";
      default:
        return "ไม่ระบุ";
    }
  };

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

  // ดูรายละเอียดโพสต์
  const viewPostDetail = async (id: number, type: string) => {
    const res = await fetch(`/api/admin/posts/${id}?type=${type}`);
    const data = await res.json();

    if (res.ok) {
      setSelectedPost(data);
      setShowModal(true);
    } else {
      alert(data.error || "ไม่สามารถโหลดข้อมูลได้");
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
                  {/* ปุ่มดูรายละเอียด */}
                  <button
                    onClick={() => viewPostDetail(post.id, post.type)}
                    className="p-2 rounded-full shadow hover:bg-blue-50 hover:text-blue-600 transition bg-white"
                  >
                    <Eye size={18} />
                  </button>

                  {/* ปุ่มแก้ไขโพสต์*/}
                  <button
                    onClick={() => setEditingPost(post)}
                    className="bg-white p-2 rounded-full shadow  hover:bg-green-50 hover:text-green-600 transition"
                  >
                    <MdModeEdit size={18} />
                  </button>

                  {/* ปุ่มลบโพสต์ */}
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

      {/* ✅ Modal แก้ไขโพสต์ */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-4">แก้ไขโพสต์</h2>

            <label className="block mb-2 text-sm font-medium">รายละเอียด</label>
            <textarea
              className="w-full border rounded p-2 mb-4"
              value={editingPost.title}
              onChange={(e) =>
                setEditingPost({ ...editingPost, title: e.target.value })
              }
            />
            <label className="block mb-2 text-sm font-medium">ช่องทางติดต่ออื่นๆ</label>
            <textarea
              className="w-full border rounded p-2 mb-4"
              value={editingPost.contact}
              onChange={(e) =>
                setEditingPost({ ...editingPost, title: e.target.value })
              }
            />

            <label className="block mb-2 text-sm font-medium">สถานะ</label>
            <select
              className="w-full border rounded p-2 mb-4"
              value={editingPost.status}
              onChange={(e) =>
                setEditingPost({ ...editingPost, status: e.target.value })
              }
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ADOPTED">ADOPTED</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/admin/posts/${editingPost.id}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          payload: {
                            title: editingPost.title,
                            status: editingPost.status,
                          },
                        }),
                      }
                    );
                    const result = await res.json();
                    if (res.ok || result.success) {
                      alert("แก้ไขสำเร็จ");
                      setEditingPost(null);
                      fetchPosts();
                    } else {
                      alert(result.error || "แก้ไขไม่สำเร็จ");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("เกิดข้อผิดพลาด");
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal แสดงรายละเอียดโพสต์ */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header with gradient */}
            <div className="relative h-32 w-full overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent"></div>
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
                      className="w-40 h-40 object-cover rounded-2xl shadow-2xl border-4 border-white transition-transform hover:scale-105"
                    />
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <FaPaw className="text-orange-400 text-xl" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-36 h-36 bg-linear-to-br from-orange-100 to-orange-200 flex items-center justify-center rounded-2xl shadow-2xl border-4 border-white transition-transform hover:scale-105">
                      <FaPaw className="text-orange-400 text-6xl" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xl">🐾</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pet Name & Status */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedPost.pet_name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-sm font-medium ${
                    selectedPost.status === "Adopted" ||
                    selectedPost.status === "ADOPTED"
                      ? "bg-green-100 text-green-700"
                      : selectedPost.status === "AVAILABLE" ||
                        selectedPost.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {(selectedPost.status === "Adopted" ||
                    selectedPost.status === "ADOPTED") && (
                    <FaCircleCheck className="text-green-700" />
                  )}
                  {selectedPost.status}
                </span>
              </div>

              {/* Description */}
              {selectedPost.title && (
                <div className="bg-[#FEFAE0] rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2 ">
                    <MdOutlineQuestionAnswer />
                    <p className="text-xs text-gray-500 font-medium">
                      รายละเอียด
                    </p>
                  </div>
                  <p className="text-sm pl-6">{selectedPost.title}</p>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3 mb-6">
                {[
                  {
                    icon: <FiMapPin />,
                    label: "ที่อยู่",
                    value: selectedPost.address,
                  },
                  {
                    icon: <HiOutlineTag />,
                    label: "สายพันธุ์",
                    value: selectedPost.gene,
                  },
                  {
                    icon:
                      selectedPost.sex === "MALE" ? (
                        <FaMars className="text-blue-500" />
                      ) : selectedPost.sex === "FEMALE" ? (
                        <FaVenus className="text-pink-500" />
                      ) : (
                        <FaGenderless className="text-gray-500" />
                      ),
                    label: "เพศ",
                    value: getSexLabel(selectedPost.sex),
                  },
                  {
                    icon: <HiOutlineCalendar />,
                    label: "อายุ",
                    value: selectedPost.age,
                  },
                  {
                    icon: <HiOutlinePhone />,
                    label: "เบอร์โทร",
                    value: selectedPost.phone,
                  },
                  {
                    icon: <RiContactsBook3Line />,
                    label: "ช่องทางติดต่ออื่นๆ",
                    value: selectedPost.contact || "-",
                  },
                  {
                    icon: <BiUser />,
                    label: "ผู้โพสต์",
                    value: selectedPost.user?.name || "ไม่ทราบชื่อ",
                  },
                  {
                    icon: <HiOutlineCalendar />,
                    label: "วันที่โพสต์",
                    value: new Date(selectedPost.createdAt).toLocaleDateString(
                      "th-TH"
                    ),
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-[#FEFAE0] rounded-lg"
                  >
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* 🩺 สถานะสุขภาพ */}
              <div className="rounded-lg">
                <div className="flex flex-wrap gap-4">
                  {/* ฉีดวัคซีน */}
                  <div className="flex items-center gap-2 text-sm md:text-base px-3 py-2 rounded-2xl shadow-sm">
                    {
                      healthStatusIcons[selectedPost.vaccinationStatus.code]
                        ?.icon
                    }
                    <span>
                      {selectedPost.vaccinationStatus.label || "ไม่ระบุ"}
                    </span>
                  </div>

                  {/* ทำหมัน */}
                  <div className="flex items-center gap-2 text-sm md:text-base px-3 py-2 rounded-2xl shadow-sm">
                    {
                      neuteredStatusIcons[selectedPost.neuteredStatus.code]
                        ?.icon
                    }
                    <span>
                      {selectedPost.neuteredStatus.label || "ไม่ระบุ"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
