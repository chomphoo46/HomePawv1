"use client";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";

// ตั้งค่า Icon สำหรับหมุด
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

export default function LocationPickerReport({ onLocationSelect, initialPos }: PickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialPos?.lat || 13.7563, initialPos?.lng || 100.5018]);

  // ฟังก์ชันหาที่อยู่จากพิกัด (Reverse Geocoding) - ใช้ของฟรีจาก Nominatim
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`);
      const data = await res.json();
      onLocationSelect(lat, lng, data.display_name || "ไม่ระบุที่อยู่");
    } catch (err) {
      onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // คอมโพเนนต์ภายในสำหรับจัดการคลิก
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
    <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <MapEvents />
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