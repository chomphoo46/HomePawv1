import { vi, describe, it, expect, beforeEach } from "vitest";
import { getServerSession } from "next-auth";

// สร้าง mock ของ Prisma method ที่ route.ts ใช้จริง
const { mockPrismaActions } = vi.hoisted(() => ({
  mockPrismaActions: {
    helpAction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// mock @prisma/client
vi.mock("@prisma/client", () => {
  class PrismaClient {
    helpAction = mockPrismaActions.helpAction;
  }

  return {
    PrismaClient,
    HelpActionType: {
      FEED: "FEED",
      ADOPT: "ADOPT",
    },
  };
});

// mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// mock authOptions เพื่อกันไม่ให้ไปเรียกของจริงจาก lib/auth
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// import route หลัง mock เสร็จ
import { POST, GET } from "./route";

describe("Help Action API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("ควรบันทึกข้อมูลสำเร็จเมื่อ login และส่งข้อมูลครบถ้วน", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "user_001" },
      });

      const mockCreatedAction = {
        id: 1,
        report_id: 10,
        action_type: "FEED",
        user_id: "user_001",
      };

      mockPrismaActions.helpAction.create.mockResolvedValue(mockCreatedAction);

      const req = new Request("http://localhost/api/help-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: 10,
          action_type: "FEED",
        }),
      });

      const res = await POST(req);
      const result = await res.json();

      expect(res.status).toBe(201);
      expect(result).toEqual({
        success: true,
        action: mockCreatedAction,
      });

      expect(mockPrismaActions.helpAction.create).toHaveBeenCalledWith({
        data: {
          report_id: 10,
          action_type: "FEED",
          user_id: "user_001",
        },
      });
    });

    it("ควรคืนค่า 401 เมื่อผู้ใช้ยังไม่ได้ login", async () => {
      (getServerSession as any).mockResolvedValue(null);

      const req = new Request("http://localhost/api/help-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: 10,
          action_type: "FEED",
        }),
      });

      const res = await POST(req);
      const result = await res.json();

      expect(res.status).toBe(401);
      expect(result).toEqual({
        error: "Unauthorized",
      });

      expect(mockPrismaActions.helpAction.create).not.toHaveBeenCalled();
    });

    it("ควรคืนค่า 400 เมื่อส่งข้อมูลไม่ครบ", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "user_001" },
      });

      const req = new Request("http://localhost/api/help-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: 10,
        }),
      });

      const res = await POST(req);
      const result = await res.json();

      expect(res.status).toBe(400);
      expect(result).toEqual({
        error: "Missing required fields (report_id, action_type)",
      });

      expect(mockPrismaActions.helpAction.create).not.toHaveBeenCalled();
    });

    it("ควรคืนค่า 400 เมื่อ report_id ไม่ใช่ตัวเลข", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "user_001" },
      });

      const req = new Request("http://localhost/api/help-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: "10",
          action_type: "FEED",
        }),
      });

      const res = await POST(req);
      const result = await res.json();

      expect(res.status).toBe(400);
      expect(result).toEqual({
        error: "Invalid report_id (must be a number)",
      });

      expect(mockPrismaActions.helpAction.create).not.toHaveBeenCalled();
    });

    it("ควรคืนค่า 400 เมื่อ action_type ไม่ถูกต้อง", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "user_001" },
      });

      const req = new Request("http://localhost/api/help-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: 10,
          action_type: "DONATE",
        }),
      });

      const res = await POST(req);
      const result = await res.json();

      expect(res.status).toBe(400);
      expect(result).toEqual({
        error: "Invalid action_type (must be FEED or ADOPT)",
      });

      expect(mockPrismaActions.helpAction.create).not.toHaveBeenCalled();
    });

    it("ควรคืนค่า 500 เมื่อบันทึกข้อมูลไม่สำเร็จ", async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: "user_001" },
      });

      mockPrismaActions.helpAction.create.mockRejectedValue(
        new Error("Database Error")
      );

      const req = new Request("http://localhost/api/help-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: 10,
          action_type: "FEED",
        }),
      });

      const res = await POST(req);
      const result = await res.json();

      expect(res.status).toBe(500);
      expect(result).toEqual({
        error: "Internal Server Error",
      });

      expect(mockPrismaActions.helpAction.create).toHaveBeenCalled();
    });
  });

  describe("GET", () => {
    it("ควรดึงข้อมูลทั้งหมดสำเร็จ", async () => {
      const mockData = [
        {
          id: 1,
          report_id: 10,
          action_type: "FEED",
          user_id: "user_001",
        },
        {
          id: 2,
          report_id: 11,
          action_type: "ADOPT",
          user_id: "user_002",
        },
      ];

      mockPrismaActions.helpAction.findMany.mockResolvedValue(mockData);

      const req = new Request("http://localhost/api/help-action", {
        method: "GET",
      });

      const res = await GET(req);
      const result = await res.json();

      expect(res.status).toBe(200);
      expect(result).toEqual(mockData);
      expect(mockPrismaActions.helpAction.findMany).toHaveBeenCalled();
    });

    it("ควรคืนค่า 500 เมื่อดึงข้อมูลไม่สำเร็จ", async () => {
      mockPrismaActions.helpAction.findMany.mockRejectedValue(
        new Error("Database Error")
      );

      const req = new Request("http://localhost/api/help-action", {
        method: "GET",
      });

      const res = await GET(req);
      const result = await res.json();

      expect(res.status).toBe(500);
      expect(result).toEqual({
        error: "Internal Server Error",
      });

      expect(mockPrismaActions.helpAction.findMany).toHaveBeenCalled();
    });
  });
});