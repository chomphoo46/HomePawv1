export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/rehoming-post"], // เส้นทางที่ต้อง login ถึงจะเข้าได้
};
