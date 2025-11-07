import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth?.token?.role; // อ่าน role จาก JWT token

    // 🔒 เส้นทางที่เฉพาะ admin เข้าได้
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url)); // redirect กลับหน้าแรก
    }

    // ✅ เส้นทางที่เฉพาะผู้ที่ล็อกอินเข้าได้ (ทั้ง user และ admin)
    if (pathname.startsWith("/frontend/form-rehoming") && !role) {
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // ถ้ามี token แสดงว่าล็อกอินแล้ว
    },
  }
);

// ✅ กำหนด matcher ให้ middleware ทำงานเฉพาะบาง path
export const config = {
  matcher: ["/admin/:path*", "/frontend/form-rehoming"],
};
