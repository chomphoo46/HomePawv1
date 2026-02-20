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
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      dragging={true}
      scrollWheelZoom={false}
      touchZoom={true}
    >
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

        const imagesList =
          post.images && post.images.length > 0
            ? post.images.map((img: any) =>
                typeof img === "string" ? img : img.image_url,
              )
            : ["https://via.placeholder.com/300x200.png?text=No+Image"];

        return (
          <Marker
            key={`${post.report_id}-${post.recent_helpers?.length || 0}`}
            position={[lat, lng]}
            icon={icon || undefined}
          >
            <Popup
              maxWidth={270}
              minWidth={270} // เพิ่ม minWidth ให้ UI นิ่ง
              maxHeight={450} // ขยาย maxHeight ของ Popup ให้ครอบคลุมเนื้อหาที่จะ scroll
              className={`${mali.className} custom-popup`}
            >
              <div
                className="flex flex-col w-full bg-white overflow-hidden"
                // หยุดทุก Event ไม่ให้ทะลุไปหาแผนที่ (ทั้งลาก, คลิก, ซูม)
                onMouseDown={(e) => L.DomEvent.stopPropagation(e as any)}
                onWheel={(e) => L.DomEvent.stopPropagation(e as any)}
              >
                {/* 1. Image Slider Section */}
                <div className="relative w-full aspect-video shrink-0 overflow-hidden group bg-gray-200">
                  <div
                    id={`slider-${post.report_id}`}
                    className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {imagesList.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        className="w-full h-full object-cover shrink-0 snap-start"
                        alt="animal"
                      />
                    ))}
                  </div>

                  {/* Slider Buttons */}
                  {imagesList.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          L.DomEvent.stopPropagation(e as any);
                          document
                            .getElementById(`slider-${post.report_id}`)
                            ?.scrollBy({ left: -200, behavior: "smooth" });
                        }}
                        className="pointer-events-auto bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/60 backdrop-blur-sm"
                      >
                        ❮
                      </button>
                      <button
                        onClick={(e) => {
                          L.DomEvent.stopPropagation(e as any);
                          document
                            .getElementById(`slider-${post.report_id}`)
                            ?.scrollBy({ left: 200, behavior: "smooth" });
                        }}
                        className="pointer-events-auto bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/60 backdrop-blur-sm"
                      >
                        ❯
                      </button>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full z-10 flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${post.status === "STILL_THERE" ? "bg-red-500" : post.status === "MOVED" ? "bg-amber-500" : "bg-green-500"} animate-pulse`}
                    />
                    <span className="text-[10px] sm:text-[11px] text-white font-bold">
                      {post.status === "STILL_THERE"
                        ? "ยังอยู่ที่เดิม"
                        : post.status === "MOVED"
                          ? "ย้าย/ไม่เจอ"
                          : "ช่วยแล้ว"}
                    </span>
                  </div>
                </div>

                {/* 2. Scrollable Content Section */}
                <div
                  className="p-3 overflow-y-auto overscroll-contain"
                  style={{
                    maxHeight: "300px",
                    WebkitOverflowScrolling: "touch", // สำหรับการ scroll ที่นุ่มนวลบน iOS
                  }}
                >
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight mb-1 truncate">
                    พบที่ {post.location}
                  </h3>

                  <p className="text-[10px] text-gray-500 mb-2">
                    {formatDateTime(post.created_at)} • โดย{" "}
                    {post.user?.name || "ไม่ระบุ"}
                  </p>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 mb-3 text-[11px] text-gray-700 space-y-1.5">
                    <p className="line-clamp-2">
                      <span className="font-semibold text-gray-400">
                        ลักษณะ:
                      </span>{" "}
                      {post.description || "ไม่มีคำอธิบาย"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-400">
                        พฤติกรรม:
                      </span>{" "}
                      {getBehaviorLabel(post.behavior)}
                    </p>
                  </div>

                  {/* Helpers Section */}
                  {post.recent_helpers && post.recent_helpers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.recent_helpers
                        .slice(0, 2)
                        .map((helper: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[9px] font-medium border border-blue-100"
                          >
                            {helper.user_name}{" "}
                            {helper.type === "FEED"
                              ? "ให้อาหารแล้ว"
                              : "สนใจรับเลี้ยง"}
                          </div>
                        ))}
                      {post.recent_helpers.length > 2 && (
                        <span className="text-[9px] text-gray-400 self-center">
                          +{post.recent_helpers.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1 pb-2">
                    <button
                      onClick={(e) => {
                        L.DomEvent.stopPropagation(e as any);
                        onHelpAction(post.report_id, "FEED");
                      }}
                      className="py-3 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl font-bold text-xs active:scale-95 transition-transform"
                    >
                      ให้อาหาร
                    </button>
                    <button
                      onClick={(e) => {
                        L.DomEvent.stopPropagation(e as any);
                        onHelpAction(post.report_id, "ADOPT");
                      }}
                      className="py-3 bg-[#D4A373] text-white rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform"
                    >
                      รับเลี้ยง
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      L.DomEvent.stopPropagation(e as any);
                      router.push(`/animal-report/${post.report_id}`);
                    }}
                    className="w-full text-[11px] text-gray-400 text-center hover:text-blue-500 transition-colors py-2"
                  >
                    ดูรายละเอียดทั้งหมด →
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
