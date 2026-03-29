import { vi, describe, it, expect, beforeEach } from "vitest";
import { getServerSession } from "next-auth";

const { mockPrismaActions } = vi.hoisted(() => ({
  mockPrismaActions: {
    animalReports: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@prisma/client", () => {
  class PrismaClient {
    animalReports = mockPrismaActions.animalReports;
  }

  return {
    PrismaClient,
    AnimalReportStatus: {
      STILL_THERE: "STILL_THERE",
    },
  };
});

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { POST, GET } from "./route";

describe("Animal Report API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ควรบันทึกสำเร็จเมื่อข้อมูลครบถ้วน (POST)", async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: "user_001" },
    });

    mockPrismaActions.animalReports.create.mockResolvedValue({
      id: "report_123",
      animal_type: "แมว",
    });

    const body = {
      animalType: "แมว",
      behavior: "เป็นมิตร",
      location: "หน้าหมู่บ้าน",
      lat: 13.5,
      lng: 100.5,
      images: ["https://image.url/1.jpg"],
    };

    const req = new Request("http://localhost/api/animal-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const result = await res.json();

    expect(res.status).toBe(201);
    expect(result.success).toBe(true);
    expect(mockPrismaActions.animalReports.create).toHaveBeenCalled();
  });

  it("ควรดึงข้อมูลสำเร็จ (GET)", async () => {
    const mockData = [{ id: "1", animal_type: "สุนัข" }];

    mockPrismaActions.animalReports.findMany.mockResolvedValue(mockData);

    const res = await GET();
    const result = await res.json();

    expect(res.status).toBe(200);
    expect(result).toEqual(mockData);
    expect(mockPrismaActions.animalReports.findMany).toHaveBeenCalled();
  });
});