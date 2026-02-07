// components/MapFocusHandler.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface MapFocusHandlerProps {
  mapRef: React.MutableRefObject<any>;
  allAnimalPosts: any[];
  markersRef: React.MutableRefObject<any[]>;
}

export default function MapFocusHandler({ 
  mapRef, 
  allAnimalPosts, 
  markersRef 
}: MapFocusHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryLat = searchParams.get("lat");
    const queryLng = searchParams.get("lng");

    // ตรวจสอบข้อมูลครบถ้วนก่อนทำงาน
    if (queryLat && queryLng && mapRef.current && allAnimalPosts.length > 0) {
      const targetPos = {
        lat: parseFloat(queryLat),
        lng: parseFloat(queryLng),
      };

      // 1. เลื่อนแผนที่ไปยังพิกัดเป้าหมายแบบสมูท
      mapRef.current.panTo(targetPos);
      mapRef.current.setZoom(17);

      // 2. ค้นหาหมุดที่ตรงกันเพื่อเปิดหน้าต่างข้อมูล (InfoWindow)
      setTimeout(() => {
        if (!markersRef.current) return;
        
        markersRef.current.forEach((marker: any) => {
          const mLat = marker.getPosition().lat().toFixed(6);
          const mLng = marker.getPosition().lng().toFixed(6);
          
          if (mLat === targetPos.lat.toFixed(6) && mLng === targetPos.lng.toFixed(6)) {
            const google = (window as any).google;
            if (google && google.maps) {
              google.maps.event.trigger(marker, 'click');
            }
          }
        });
      }, 800); // หน่วงเวลาให้แผนที่โหลดหมุดจนเสร็จ
    }
  }, [searchParams, allAnimalPosts, mapRef, markersRef]);

  return null; // Component นี้ทำหน้าที่เป็น Logic Controller เท่านั้น
}