import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;
    const role = token?.role;

    // 1. 🔒 กักกันหน้า Admin: ต้องเป็น admin เท่านั้น
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    // 2. 🔒 กักกันหน้าแจ้งพบสัตว์ และหน้าหาบ้าน: ถ้าไม่มี token (Guest) ให้ไปหน้า Login
    const protectedPaths = ["/form-rehoming", "/animal-report"];
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));

    if (isProtected && !token) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // ✅ ส่งคืน true เพื่อให้เข้ามารัน Logic เช็คสิทธิ์ข้างบนได้
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/form-rehoming",
    "/animal-report/:path*", // บังคับเช็คหน้าแจ้งพบสัตว์ด้วย
    "/profile/:path*",
  ],
};