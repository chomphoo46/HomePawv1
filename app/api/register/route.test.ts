import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

// ใช้ hoisted เพื่อให้ mock ถูกสร้างก่อน vi.mock
const { mockPrismaActions } = vi.hoisted(() => ({
  mockPrismaActions: {
    user: {
      create: vi.fn(),
    },
  },
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
    hash: vi.fn(),
  },
}));

// import route หลัง mock เสร็จ
import { POST } from "./route";

describe("Register API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ควรสมัครสมาชิกสำเร็จเมื่อกรอกข้อมูลครบถ้วน", async () => {
    // mock bcrypt.hash
    (bcrypt.hash as any).mockResolvedValue("hashed_password_123");

    // mock prisma.user.create
    mockPrismaActions.user.create.mockResolvedValue({
      user_id: "user_001",
      name: "Fern",
      email: "fern@example.com",
      password: "hashed_password_123",
    });

    const req = new Request("http://localhost/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Fern",
        email: "fern@example.com",
        password: "123456",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(201);
    expect(result).toEqual({
      message: "สมัครสมาชิกสำเร็จ",
      User: {
        user_id: "user_001",
        name: "Fern",
        email: "fern@example.com",
      },
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("123456", 10);

    expect(mockPrismaActions.user.create).toHaveBeenCalledWith({
      data: {
        name: "Fern",
        email: "fern@example.com",
        password: "hashed_password_123",
      },
    });
  });

  it("ควรคืนค่า 400 เมื่อกรอกข้อมูลไม่ครบ", async () => {
    const req = new Request("http://localhost/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Fern",
        email: "",
        password: "123456",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(400);
    expect(result).toEqual({
      error: "กรุณากรอกชื่อ อีเมล และรหัสผ่าน",
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockPrismaActions.user.create).not.toHaveBeenCalled();
  });

  it("ควรคืนค่า 500 เมื่อบันทึกข้อมูลไม่สำเร็จ", async () => {
    (bcrypt.hash as any).mockResolvedValue("hashed_password_123");

    mockPrismaActions.user.create.mockRejectedValue(
      new Error("Database Error")
    );

    const req = new Request("http://localhost/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Fern",
        email: "fern@example.com",
        password: "123456",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(500);
    expect(result).toEqual({
      error: "เกิดข้อผิดพลาดในระบบ",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("123456", 10);
    expect(mockPrismaActions.user.create).toHaveBeenCalled();
  });

  it("ควรคืนค่า 500 เมื่อ hash password ไม่สำเร็จ", async () => {
    (bcrypt.hash as any).mockRejectedValue(new Error("Hash Error"));

    const req = new Request("http://localhost/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Fern",
        email: "fern@example.com",
        password: "123456",
      }),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(500);
    expect(result).toEqual({
      error: "เกิดข้อผิดพลาดในระบบ",
    });

    expect(mockPrismaActions.user.create).not.toHaveBeenCalled();
  });
});