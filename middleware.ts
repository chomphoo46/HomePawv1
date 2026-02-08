import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth?.token?.role;

    // 🔒 ป้องกัน Admin Path: ถ้าไม่ใช่ admin ให้เด้งกลับหน้าแรก
    if (pathname.startsWith("/admin") && role !== "admin") {
      // ✅ ใช้ req.nextUrl.clone() หรือระบุ Origin ให้ชัดเจนเพื่อความปลอดภัย
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    // ✅ ป้องกันหน้าฟอร์มหาบ้าน: ถ้าไม่ได้ Login ให้ไปหน้า Signin
    // หมายเหตุ: ตรวจสอบ path ให้ตรงกับโครงสร้างจริง (เช่น /form-rehoming)
    if (pathname.startsWith("/form-rehoming") && !role) {
      return NextResponse.redirect(
        new URL("/api/auth/signin", req.nextUrl.origin),
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // บังคับว่าต้องมี token ถึงจะเข้ามาในระบบตาม matcher ได้
      authorized: ({ token }) => !!token,
    },
  },
);

// ✅ กำหนด matcher ให้ครอบคลุมทุกหน้าที่ต้องการความปลอดภัย
export const config = {
  matcher: [
    "/admin/:path*",
    "/form-rehoming",
    "/animal-report/:path*", // เพิ่มส่วนนี้เพื่อให้การจัดการสัตว์ปลอดภัยขึ้น
  ],
};
