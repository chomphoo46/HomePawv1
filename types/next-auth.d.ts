import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // หรือ number ถ้าฐานข้อมูลคุณเก็บเป็น number
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
