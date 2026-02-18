"use client";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";

const pickerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface PickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialPos?: { lat: number; lng: number };
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LocationPickerReport({
  onLocationSelect,
  initialPos,
}: PickerProps) {
  // กำหนดตำแหน่งเริ่มต้น
  const [position, setPosition] = useState<[number, number]>([
    13.7563, 100.5018,
  ]);

  // ✅ เมื่อ initialPos เปลี่ยน (จาก Geolocation ในตัวแม่) ให้ Update หมุดในแผนที่นี้ด้วย
  useEffect(() => {
    if (initialPos) {
      setPosition([initialPos.lat, initialPos.lng]);
    }
  }, [initialPos]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`,
      );
      const data = await res.json();
      onLocationSelect(lat, lng, data.display_name || "ไม่ระบุที่อยู่");
    } catch (err) {
      onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        fetchAddress(lat, lng);
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <MapEvents />
      {/* สั่งให้แผนที่เลื่อนตามเมื่อเจอพิกัดปัจจุบัน */}
      {initialPos && <ChangeView center={[initialPos.lat, initialPos.lng]} />}

      <Marker
        position={position}
        icon={pickerIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const { lat, lng } = marker.getLatLng();
            setPosition([lat, lng]);
            fetchAddress(lat, lng);
          },
        }}
      />
    </MapContainer>
  );
}
