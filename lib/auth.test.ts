import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

// mock prisma methods
const { mockPrismaActions } = vi.hoisted(() => ({
  mockPrismaActions: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// mock next-auth main function
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    GET: vi.fn(),
    POST: vi.fn(),
  })),
}));

// mock CredentialsProvider ให้คืน config กลับมา เพื่อเข้าถึง authorize ได้
vi.mock("next-auth/providers/credentials", () => ({
  default: (config: any) => ({
    id: "credentials",
    name: "Credentials",
    type: "credentials",
    ...config,
  }),
}));

// mock GoogleProvider
vi.mock("next-auth/providers/google", () => ({
  default: (config: any) => ({
    id: "google",
    name: "Google",
    type: "oauth",
    ...config,
  }),
}));

// mock PrismaClient
vi.mock("@prisma/client", () => {
  class PrismaClient {
    user = mockPrismaActions.user;
  }

  return {
    PrismaClient,
  };
});

// mock bcrypt
vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { authOptions } from "./auth";

describe("authOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Credentials authorize", () => {
    it("ควร login สำเร็จเมื่อ email และ password ถูกต้อง", async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      mockPrismaActions.user.findUnique.mockResolvedValue({
        user_id: "user_001",
        name: "Fern",
        email: "fern@example.com",
        password: "hashed_password",
        role: "user",
      });

      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await credentialsProvider.authorize({
        email: "fern@example.com",
        password: "123456",
      });

      expect(mockPrismaActions.user.findUnique).toHaveBeenCalledWith({
        where: { email: "fern@example.com" },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "123456",
        "hashed_password"
      );

      expect(result).toEqual({
        id: "user_001",
        name: "Fern",
        email: "fern@example.com",
        role: "user",
      });
    });

    it("ควร throw error เมื่อไม่กรอก email หรือ password", async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      await expect(
        credentialsProvider.authorize({
          email: "",
          password: "",
        })
      ).rejects.toThrow("กรุณากรอกอีเมลและรหัสผ่าน");

      expect(mockPrismaActions.user.findUnique).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("ควร throw error เมื่อไม่พบบัญชีผู้ใช้", async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      mockPrismaActions.user.findUnique.mockResolvedValue(null);

      await expect(
        credentialsProvider.authorize({
          email: "fern@example.com",
          password: "123456",
        })
      ).rejects.toThrow("ไม่พบบัญชีผู้ใช้นี้");

      expect(mockPrismaActions.user.findUnique).toHaveBeenCalledWith({
        where: { email: "fern@example.com" },
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("ควร throw error เมื่อ password ไม่ถูกต้อง", async () => {
      const credentialsProvider = authOptions.providers[0] as any;

      mockPrismaActions.user.findUnique.mockResolvedValue({
        user_id: "user_001",
        name: "Fern",
        email: "fern@example.com",
        password: "hashed_password",
        role: "user",
      });

      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        credentialsProvider.authorize({
          email: "fern@example.com",
          password: "wrong-password",
        })
      ).rejects.toThrow("รหัสผ่านไม่ถูกต้อง");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrong-password",
        "hashed_password"
      );
    });
  });

  describe("Google signIn callback", () => {
    it("ควรสร้าง user ใหม่เมื่อ login ด้วย Google และยังไม่มีในระบบ", async () => {
      const signIn = authOptions.callbacks?.signIn as any;

      mockPrismaActions.user.findUnique.mockResolvedValue(null);
      mockPrismaActions.user.create.mockResolvedValue({
        user_id: "user_google_001",
        email: "google@example.com",
        name: "Google User",
        googleId: "google-123",
        role: "user",
      });

      const user = {
        email: "google@example.com",
        name: "Google User",
      } as any;

      const account = {
        provider: "google",
        providerAccountId: "google-123",
      } as any;

      const result = await signIn({ user, account });

      expect(result).toBe(true);
      expect(mockPrismaActions.user.findUnique).toHaveBeenCalledWith({
        where: { email: "google@example.com" },
      });

      expect(mockPrismaActions.user.create).toHaveBeenCalledWith({
        data: {
          email: "google@example.com",
          name: "Google User",
          googleId: "google-123",
          role: "user",
        },
      });

      expect(user.id).toBe("user_google_001");
      expect(user.role).toBe("user");
    });

    it("ควร update googleId เมื่อมี user อยู่แล้วแต่ยังไม่มี googleId", async () => {
      const signIn = authOptions.callbacks?.signIn as any;

      mockPrismaActions.user.findUnique.mockResolvedValue({
        user_id: "user_001",
        email: "google@example.com",
        name: "Google User",
        googleId: null,
        role: "user",
      });

      mockPrismaActions.user.update.mockResolvedValue({
        user_id: "user_001",
        email: "google@example.com",
        name: "Google User",
        googleId: "google-123",
        role: "user",
      });

      const user = {
        email: "google@example.com",
        name: "Google User",
      } as any;

      const account = {
        provider: "google",
        providerAccountId: "google-123",
      } as any;

      const result = await signIn({ user, account });

      expect(result).toBe(true);
      expect(mockPrismaActions.user.update).toHaveBeenCalledWith({
        where: { user_id: "user_001" },
        data: { googleId: "google-123" },
      });

      expect(user.id).toBe("user_001");
      expect(user.role).toBe("user");
    });

    it("ควรไม่ create/update ถ้าเป็น provider อื่น", async () => {
      const signIn = authOptions.callbacks?.signIn as any;

      const user = {
        email: "fern@example.com",
        name: "Fern",
      } as any;

      const account = {
        provider: "credentials",
      } as any;

      const result = await signIn({ user, account });

      expect(result).toBe(true);
      expect(mockPrismaActions.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaActions.user.create).not.toHaveBeenCalled();
      expect(mockPrismaActions.user.update).not.toHaveBeenCalled();
    });
  });

  describe("JWT callback", () => {
    it("ควรเก็บ id name role ลง token เมื่อมี user", async () => {
      const jwt = authOptions.callbacks?.jwt as any;

      const result = await jwt({
        token: {},
        user: {
          id: "user_001",
          name: "Fern",
          role: "admin",
        },
      });

      expect(result).toEqual({
        id: "user_001",
        name: "Fern",
        role: "admin",
      });
    });

    it("ควรคืน token เดิมเมื่อไม่มี user", async () => {
      const jwt = authOptions.callbacks?.jwt as any;

      const result = await jwt({
        token: { id: "old_id", name: "Old", role: "user" },
        user: undefined,
      });

      expect(result).toEqual({
        id: "old_id",
        name: "Old",
        role: "user",
      });
    });
  });

  describe("Session callback", () => {
    it("ควรเอาค่าใน token ใส่กลับเข้า session.user", async () => {
      const sessionCallback = authOptions.callbacks?.session as any;

      const result = await sessionCallback({
        session: {
          user: {},
        },
        token: {
          id: "user_001",
          name: "Fern",
          role: "admin",
        },
      });

      expect(result).toEqual({
        user: {
          id: "user_001",
          name: "Fern",
          role: "admin",
        },
      });
    });
  });
});