export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/forntend/form-rehoming"], // เส้นทางที่ต้อง login ถึงจะเข้าได้
};
