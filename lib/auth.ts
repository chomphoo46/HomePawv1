import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("ไม่พบบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิก");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        return {
          id: user.user_id.toString(), // ใช้ user_id จริงจาก DB และแปลงเป็น string
          name: user.name ?? "",
          email: user.email,
        };
      },
    }),

    // Google Login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // signIn ใช้สร้าง/อัปเดต user และ map user_id จริง
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser) {
          // สร้าง user ใหม่
          dbUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? "",
              googleId: account.providerAccountId,
              // password: ไม่ต้องใส่สำหรับ Google login
            },
          });
        } else if (!dbUser.googleId) {
          // ผูก GoogleId ถ้ายังไม่เคยผูก
          dbUser = await prisma.user.update({
            where: { user_id: dbUser.user_id },
            data: { googleId: account.providerAccountId },
          });
        }

        // ✅ map user_id จริงจาก DB
        user.id = dbUser.user_id.toString();
      }
      return true;
    },

    // jwt callback map token.id เป็น user_id จริง
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },

    // session callback map session.user.id เป็น user_id จริง
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = session.user.email; // ยังคงมีอีเมล
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
