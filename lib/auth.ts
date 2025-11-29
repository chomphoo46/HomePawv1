import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    // 🔹 Credentials Login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password)
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password)
          throw new Error("ไม่พบบัญชีผู้ใช้นี้");

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid)
          throw new Error("รหัสผ่านไม่ถูกต้อง");

        return {
          id: user.user_id,
          name: user.name ?? "",
          email: user.email,
          role: user.role, // ✅ เพิ่ม role
        };
      },
    }),

    // 🔹 Google Login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // Sign in ผ่าน Google
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? "",
              googleId: account.providerAccountId,
              role: "user",
            },
          });
        } else if (!dbUser.googleId) {
          dbUser = await prisma.user.update({
            where: { user_id: dbUser.user_id },
            data: { googleId: account.providerAccountId },
          });
        }

        user.id = dbUser.user_id;
        user.role = dbUser.role; // ✅ map role
      }

      return true;
    },

    // JWT callback
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role; // ✅ เพิ่ม role ใน token
      }
      return token;
    },

    // Session callback
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string; // ✅ เพิ่ม role ใน session
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
