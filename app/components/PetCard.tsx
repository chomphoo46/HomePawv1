"use client";

import Link from "next/link";
import { FaMars, FaVenus, FaGenderless, FaCircleCheck } from "react-icons/fa6";
import {
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlinePhone,
} from "react-icons/hi";
import { FiMapPin } from "react-icons/fi";
import { MdOutlineQuestionAnswer } from "react-icons/md";
import { FaTimesCircle } from "react-icons/fa";

const healthStatusIcons: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  VACCINATED: {
    label: "ฉีดวัคซีนแล้ว",
    icon: <FaCircleCheck size={16} className="text-green-500" />,
  },
  NOT_VACCINATED: {
    label: "ยังไม่ได้ฉีดวัคซีน",
    icon: <FaTimesCircle size={16} className="text-red-500" />,
  },
};

const neuteredstatusIcons: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  NEUTERED: {
    label: "ทำหมันแล้ว",
    icon: <FaCircleCheck size={16} className="text-green-500" />,
  },
  NOT_NEUTERED: {
    label: "ยังไม่ได้ทำหมัน",
    icon: <FaTimesCircle size={16} className="text-red-500" />,
  },
};

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

// --- Component Definition ---
interface PetCardProps {
  post: any; // หรือใส่ Type Interface ของ PetRehomePost ถ้ามี
}

export default function PetCard({ post }: PetCardProps) {
  const isAdopted = post.status === "ADOPTED";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-white group border border-gray-100 flex flex-col h-full">
      <Link
        href={`/rehoming-report/${post.post_id}`}
        className="flex flex-col h-full group bg-white rounded-2xl p-3 transition-all duration-300 border border-transparent hover:border-orange-200"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden rounded-xl mb-3">
          <div className="absolute top-3 right-3 z-10">
            {isAdopted ? (
              <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                <FaCircleCheck className="text-white" /> ได้บ้านแล้ว
              </span>
            ) : (
              <span className="bg-[#D4A373]/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                หาบ้านอยู่
              </span>
            )}
          </div>

          {/* Image */}
          {post.images?.length > 0 ? (
            <img
              src={post.images[0].image_url}
              alt={post.pet_name}
              className={`w-full aspect-4/3 object-cover transition-transform duration-500 group-hover:scale-110 ${
                isAdopted ? "grayscale opacity-80" : "group-hover:scale-105"
              }`}
            />
          ) : (
            <div className="w-full aspect-4/3 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              ไม่มีรูปภาพ
            </div>
          )}

          {/* Overlay for Adopted */}
          {isAdopted && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center"></div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 text-sm md:text-base text-gray-700 space-y-2 grow">
          <h2 className="font-bold text-lg text-gray-800 group-hover:text-[#D4A373] transition-colors line-clamp-1">
            {post.pet_name}
          </h2>

          <div className="flex items-center gap-2">
            <HiOutlineTag className="text-[#D4A373] shrink-0" />
            <span className="truncate">{post.type || "ไม่ระบุ"}</span>
          </div>

          <div className="flex items-center gap-2">
            {post.sex === "MALE" ? (
              <FaMars className="text-blue-500 shrink-0" />
            ) : post.sex === "FEMALE" ? (
              <FaVenus className="text-pink-500 shrink-0" />
            ) : (
              <FaGenderless className="text-gray-400 shrink-0" />
            )}
            <span className="truncate">{getSexLabel(post.sex)}</span>
          </div>

          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="text-[#D4A373] shrink-0" />
            <span className="truncate">อายุ: {post.age || "ไม่ระบุ"}</span>
          </div>

          <div className="flex items-center gap-2">
            <MdOutlineQuestionAnswer className="text-[#D4A373] shrink-0" />
            <span className="truncate line-clamp-1">
              เหตุผล: {post.reason || "ไม่ระบุ"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <HiOutlinePhone className="text-[#D4A373] shrink-0" />
            <span className="truncate">{post.phone || "ไม่ระบุ"}</span>
          </div>

          <div className="flex items-center gap-2">
            <FiMapPin className="text-red-500 shrink-0" />
            <span className="truncate line-clamp-1">
              {post.address || "ไม่ระบุ"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 mt-auto">
          <div className="flex items-center justify-between gap-4 text-xs md:text-sm pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <span className="shrink-0">
                {healthStatusIcons[post.vaccination_status]?.icon}
              </span>
              <span className="truncate">
                {healthStatusIcons[post.vaccination_status]?.label || "ไม่ระบุ"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 truncate min-w-0">
              <span className="shrink-0">
                {neuteredstatusIcons[post.neutered_status]?.icon}
              </span>
              <span className="truncate">
                {neuteredstatusIcons[post.neutered_status]?.label || "ไม่ระบุ"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
