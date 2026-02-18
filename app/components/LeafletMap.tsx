"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Mali } from "next/font/google";

const mali = Mali({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "700"],
});

function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

const getLeafletIcon = (type: string, isHighMatch: boolean) => {
  if (typeof window === "undefined") return null;
  const size = isHighMatch ? 60 : 48;
  const iconMap: Record<string, string> = {
    dog: "/icons/pin-dog.png",
    cat: "/icons/pin-cat.png",
    other: "/icons/pin-other.png",
  };
  return L.icon({
    iconUrl: iconMap[type] || iconMap.other,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

interface LeafletMapProps {
  posts: any[];
  center: [number, number];
  zoom: number;
  isSmartSearch: boolean;
  router: any;
  formatDateTime: (d: string) => string;
  getBehaviorLabel: (b: string) => string;
  onHelpAction: (postId: string, type: "FEED" | "ADOPT") => void;
}

export default function LeafletMap({
  posts,
  center,
  zoom,
  isSmartSearch,
  router,
  formatDateTime,
  getBehaviorLabel,
  onHelpAction,
}: LeafletMapProps) {
  if (typeof window === "undefined") return null;

  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full z-0">
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {posts.map((post) => {
        const lat = parseFloat(post.latitude);
        const lng = parseFloat(post.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        const icon = getLeafletIcon(
          post.animal_type,
          isSmartSearch && post.matchScore > 70,
        );

        // --- เตรียมข้อมูลรูปภาพสำหรับ Slider ---
        const imagesList =
          post.images && post.images.length > 0
            ? post.images.map((img: any) =>
                typeof img === "string" ? img : img.image_url,
              )
            : ["https://via.placeholder.com/300x200.png?text=No+Image"];

        return (
          <Marker
            key={post.report_id}
            position={[lat, lng]}
            icon={icon || undefined}
          >
            <Popup minWidth={280} className={mali.className}>
              <div className="flex flex-col w-full bg-white overflow-hidden">
                {/* 1. ส่วนรูปภาพและ Image Slider */}
                <div className="relative w-full h-35 overflow-hidden group">
                  <div
                    id={`slider-${post.report_id}`}
                    className="flex overflow-x-auto scroll-snap-x mandatory h-full no-scrollbar"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {imagesList.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        className="w-full h-full object-cover shrink-0 scroll-snap-align-start"
                        alt="animal"
                      />
                    ))}
                  </div>

                  {/* ปุ่มลูกศร */}
                  {imagesList.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          document
                            .getElementById(`slider-${post.report_id}`)
                            ?.scrollBy({ left: -200, behavior: "smooth" })
                        }
                        className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center z-20 hover:bg-black/70"
                      >
                        ❮
                      </button>
                      <button
                        onClick={() =>
                          document
                            .getElementById(`slider-${post.report_id}`)
                            ?.scrollBy({ left: 200, behavior: "smooth" })
                        }
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center z-20 hover:bg-black/70"
                      >
                        ❯
                      </button>
                    </>
                  )}

                  {/* Badge สถานะ */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full z-10 flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        post.status === "STILL_THERE"
                          ? "bg-red-500"
                          : post.status === "MOVED"
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                    />
                    <span className="text-[10px] text-white font-semibold">
                      {post.status === "STILL_THERE"
                        ? "ยังอยู่ที่เดิม"
                        : post.status === "MOVED"
                          ? "ย้าย/ไม่เจอ"
                          : "ช่วยแล้ว"}
                    </span>
                  </div>
                </div>

                {/* 2. ส่วนข้อมูลรายละเอียด */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">
                    พบที่ {post.location}
                  </h3>
                  <p className="text-[10px] text-gray-400 mb-2">
                    {formatDateTime(post.created_at)} • โดย{" "}
                    {post.user?.name || "ไม่ระบุ"}
                  </p>

                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 mb-3 text-[11px] text-gray-700 space-y-1">
                    <p>
                      <span className="text-gray-400">ลักษณะ:</span>{" "}
                      {post.description || "ไม่มีคำอธิบาย"}
                    </p>
                    <p>
                      <span className="text-gray-400">พฤติกรรม:</span>{" "}
                      {getBehaviorLabel(post.behavior)}
                    </p>
                  </div>

                  {/* ปุ่ม Action */}
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => onHelpAction(post.report_id, "FEED")} // แก้ตรงนี้
                      className="flex-1 h-9 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl font-bold text-xs hover:bg-orange-100"
                    >
                      ให้อาหาร
                    </button>
                    <button
                      onClick={() => onHelpAction(post.report_id, "ADOPT")} // แก้ตรงนี้
                      className="flex-1 h-9 bg-[#D4A373] text-white rounded-xl font-bold text-xs hover:bg-[#c49261]"
                    >
                      รับเลี้ยง
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      router.push(`/animal-report/${post.report_id}`)
                    }
                    className="w-full text-[10px] text-gray-400 underline hover:text-gray-600"
                  >
                    ดูรายละเอียดเพิ่มเติม
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
