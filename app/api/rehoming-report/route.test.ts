// นำเข้าฟังก์ชันที่ใช้เขียน unit test จาก Vitest
import { vi, describe, it, expect, beforeEach } from "vitest";

// นำเข้า getServerSession เพราะใน route.ts มีการเรียกใช้
// เราจะ mock ตัวนี้เพื่อควบคุมสถานะ login
import { getServerSession } from "next-auth";

// ======================================================
// ส่วนที่ 1: สร้าง mock object ของ Prisma
// ======================================================
// ใช้ vi.hoisted เพื่อให้ตัวแปรนี้ถูกสร้างก่อน vi.mock ทำงาน
// สำคัญมาก เพราะ route.ts จะ import PrismaClient ตั้งแต่ตอนโหลดไฟล์
const { mockPrismaActions } = vi.hoisted(() => ({
  mockPrismaActions: {
    // ชื่อนี้ต้องอิงจาก route.ts จริง
    // ใน route.ts ใช้ prisma.petRehomePost.create และ findMany
    // ดังนั้น mock ต้องใช้ชื่อ petRehomePost ให้ตรงกัน
    petRehomePost: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// ======================================================
// ส่วนที่ 2: mock @prisma/client
// ======================================================
// ใน route.ts มี
// import { PrismaClient, PetRehomeStatus, VaccinationStatus, NeuteredStatus, PetSex } from "@prisma/client";
//
// เพราะฉะนั้น test ต้อง mock ทุกตัวที่ route.ts ใช้งาน
vi.mock("@prisma/client", () => {
  // สร้าง PrismaClient ปลอมขึ้นมา
  // เหตุผลที่ใช้ class เพราะใน route.ts มี new PrismaClient()
  // ถ้าใช้แค่ vi.fn() บางกรณีจะเกิด error ว่า not a constructor
  class PrismaClient {
    // ชื่อนี้ต้องตรงกับ model ที่ route.ts เรียกใช้
    petRehomePost = mockPrismaActions.petRehomePost;
  }

  return {
    PrismaClient,

    // mock enum ที่ route.ts ใช้จริง
    // ค่าเหล่านี้อิงจากฝั่ง route.ts ที่กำหนด status เป็น PetRehomeStatus.AVAILABLE
    PetRehomeStatus: {
      AVAILABLE: "AVAILABLE",
    },

    // ค่า enum พวกนี้เอาไว้ให้ route.ts cast type ได้
    // แม้ test จะไม่ได้เช็ค enum ทั้งหมด แต่ควรมีไว้ให้ import ไม่พัง
    VaccinationStatus: {
      VACCINATED: "VACCINATED",
      NOT_VACCINATED: "NOT_VACCINATED",
      UNKNOWN: "UNKNOWN",
    },

    NeuteredStatus: {
      NEUTERED: "NEUTERED",
      NOT_NEUTERED: "NOT_NEUTERED",
      UNKNOWN: "UNKNOWN",
    },

    PetSex: {
      MALE: "MALE",
      FEMALE: "FEMALE",
      UNKNOWN: "UNKNOWN",
    },
  };
});

// ======================================================
// ส่วนที่ 3: mock next-auth
// ======================================================
// route.ts เรียก getServerSession(authOptions)
// เราเลยต้อง mock เพื่อจำลองทั้งกรณี login และไม่ได้ login
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// ======================================================
// ส่วนที่ 4: mock authOptions จาก lib/auth
// ======================================================
// route.ts import authOptions จาก "@/lib/auth"
// แต่ใน lib/auth มักมีการสร้าง PrismaClient จริง
// ถ้าไม่ mock ไฟล์นี้ อาจทำให้ test ไปรันของจริงและพังได้
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// ======================================================
// ส่วนที่ 5: import route หลัง mock เสร็จ
// ======================================================
// ต้อง import หลัง mock เพื่อให้ POST/GET ใช้ dependency ปลอมที่เราสร้างไว้
import { POST, GET } from "./route";

// ======================================================
// ชุดทดสอบหลัก
// ======================================================
describe("Pet Rehome Post API", () => {
  // ล้าง mock ทุกครั้งก่อนเริ่มแต่ละ test
  // ป้องกันค่าจาก test ก่อนหน้ามาปน
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====================================================
  // Test Case: POST สำเร็จ
  // ====================================================
  it("ควรบันทึกประกาศสำเร็จเมื่อข้อมูลครบถ้วน (POST)", async () => {
    // mock session ให้เหมือนผู้ใช้ login แล้ว
    // อิงจาก route.ts ที่เช็ค session?.user?.id
    (getServerSession as any).mockResolvedValue({
      user: { id: "user_001" },
    });

    // ข้อมูลที่ prisma.create จะคืนกลับมา
    // route.ts ส่ง createdPost กลับตรง ๆ
    const mockCreatedPost = {
      id: "post_123",
      user_id: "user_001",
      phone: "0812345678",
      pet_name: "มะลิ",
      type: "แมว",
      age: 13,
      sex: "FEMALE",
      vaccination_status: "VACCINATED",
      neutered_status: "NEUTERED",
      reason: "เจ้าของไม่สามารถดูแลได้",
      address: "123 หมู่บ้านสุขใจ",
      contact: "facebook:chatuchak",
      status: "AVAILABLE",
      images: [{ image_url: "https://image.url/1.jpg" }],
    };

    // กำหนดว่าเมื่อ route เรียก prisma.petRehomePost.create()
    // ให้คืนค่า mockCreatedPost นี้กลับมา
    mockPrismaActions.petRehomePost.create.mockResolvedValue(mockCreatedPost);

    // request body จำลอง
    // field ทั้งหมดต้องอิงจาก body ที่ route.ts destructure ออกมา
    const body = {
      phone: "0812345678",
      pet_name: "มะลิ",
      type: "แมว",
      age: 13,
      sex: "FEMALE",
      vaccination_status: "VACCINATED",
      neutered_status: "NEUTERED",
      reason: "เจ้าของไม่สามารถดูแลได้",
      address: "123 หมู่บ้านสุขใจ",
      contact: "facebook:chatuchak",
      images: ["https://image.url/1.jpg"],
    };

    // จำลอง Request object สำหรับเรียก POST
    const req = new Request("http://localhost/api/pet-rehome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // เรียกฟังก์ชัน POST จาก route.ts โดยตรง
    const res = await POST(req);
    const result = await res.json();

    // ตรวจสอบ status ที่ route.ts return
    expect(res.status).toBe(201);

    // route.ts return createdPost ตรง ๆ
    // เพราะฉะนั้น result ต้องเท่ากับ mockCreatedPost
    expect(result).toEqual(mockCreatedPost);

    // ตรวจสอบว่า prisma.create ถูกเรียกด้วยข้อมูลที่ถูกต้อง
    // โครงสร้างนี้เอามาจากใน route.ts ตรง ๆ
    expect(mockPrismaActions.petRehomePost.create).toHaveBeenCalledWith({
      data: {
        user_id: "user_001",
        phone: "0812345678",
        pet_name: "มะลิ",
        type: "แมว",
        sex: "FEMALE",
        age: 13,
        vaccination_status: "VACCINATED",
        neutered_status: "NEUTERED",
        address: "123 หมู่บ้านสุขใจ",
        contact: "facebook:chatuchak",
        reason: "เจ้าของไม่สามารถดูแลได้",
        status: "AVAILABLE",
        images: {
          // ส่วนนี้อิงจาก route.ts ที่ใช้ images.map(...)
          create: [
            {
              image_url: "https://image.url/1.jpg",
            },
          ],
        },
      },
      // อิงจาก route.ts ที่ include: { images: true }
      include: { images: true },
    });
  });

  // ====================================================
  // Test Case: POST ไม่ผ่านเพราะยังไม่ได้ login
  // ====================================================
  it("ควรคืนค่า 401 เมื่อยังไม่ได้ login (POST)", async () => {
    // จำลองว่าไม่มี session
    (getServerSession as any).mockResolvedValue(null);

    const body = {
      phone: "0812345678",
      pet_name: "มะลิ",
      type: "แมว",
      age: 13,
      sex: "FEMALE",
      vaccination_status: "VACCINATED",
      neutered_status: "NEUTERED",
      reason: "เจ้าของไม่สามารถดูแลได้",
      address: "123 หมู่บ้านสุขใจ",
      contact: "facebook:chatuchak",
      images: ["https://image.url/1.jpg"],
    };

    const req = new Request("http://localhost/api/pet-rehome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const result = await res.json();

    // อิงจาก route.ts
    // ถ้าไม่มี session.user.id จะ return 401
    expect(res.status).toBe(401);
    expect(result).toEqual({ error: "Unauthorized" });

    // และไม่ควรไปเรียก create
    expect(mockPrismaActions.petRehomePost.create).not.toHaveBeenCalled();
  });

  // ====================================================
  // Test Case: POST ไม่ผ่านเพราะข้อมูลไม่ครบ
  // ====================================================
  it("ควรคืนค่า 400 เมื่อกรอกข้อมูลไม่ครบ (POST)", async () => {
    // จำลองว่า login แล้ว
    (getServerSession as any).mockResolvedValue({
      user: { id: "user_001" },
    });

    // ส่งข้อมูลไม่ครบ เช่น pet_name ว่าง และ images เป็น array ว่าง
    // อิงตามเงื่อนไข validation ใน route.ts
    const body = {
      phone: "0812345678",
      pet_name: "",
      type: "แมว",
      age: 13,
      sex: "FEMALE",
      vaccination_status: "VACCINATED",
      neutered_status: "NEUTERED",
      reason: "เจ้าของไม่สามารถดูแลได้",
      address: "123 หมู่บ้านสุขใจ",
      contact: "facebook:chatuchak",
      images: [],
    };

    const req = new Request("http://localhost/api/pet-rehome", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const res = await POST(req);
    const result = await res.json();

    // อิงจาก route.ts ที่ return 400 เมื่อข้อมูลไม่ครบ
    expect(res.status).toBe(400);
    expect(result).toEqual({ error: "กรอกข้อมูลไม่ครบ" });

    // ไม่ควรไปเรียก create
    expect(mockPrismaActions.petRehomePost.create).not.toHaveBeenCalled();
  });

  // ====================================================
  // Test Case: GET สำเร็จ
  // ====================================================
  it("ควรดึงประกาศทั้งหมดสำเร็จ (GET)", async () => {
    // ข้อมูลจำลองที่ findMany จะคืนกลับมา
    const mockData = [
      {
        id: "1",
        pet_name: "โบ้",
        type: "สุนัข",
        images: [{ image_url: "https://image.url/dog.jpg" }],
        user: { name: "Fern", email: "fern@example.com" },
      },
    ];

    // กำหนดค่าตอบกลับของ findMany
    mockPrismaActions.petRehomePost.findMany.mockResolvedValue(mockData);

    const res = await GET();
    const result = await res.json();

    // GET ปกติ NextResponse.json(posts) จะได้ status 200
    expect(res.status).toBe(200);
    expect(result).toEqual(mockData);

    // ตรวจสอบว่า findMany ถูกเรียกตาม query ใน route.ts จริง
    expect(mockPrismaActions.petRehomePost.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: "desc" },
      include: {
        images: true,
        user: { select: { name: true, email: true } },
      },
    });
  });
});