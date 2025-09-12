import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("ไม่พบบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิก");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        // ✅ ส่ง name และ id กลับ
        return {
          id: user.user_id.toString(),
          name: user.name,
          email: user.email,
  
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // เมื่อ authorize สำเร็จ user จะมีข้อมูล
      if (user) {
        token.id = user.id;
        token.name = user.name; // ✅ เก็บชื่อไว้ใน token
      }
      return token;
    },
    async session({ session, token }) {
      // ส่งข้อมูลจาก token กลับไปที่ session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string; // ✅ ส่งชื่อออกไปใน session
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
