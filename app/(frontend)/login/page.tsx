"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { AiOutlineMail } from "react-icons/ai";
import { CiLock } from "react-icons/ci";

export default function LoginPage() {
  const router = useRouter();

  // เก็บข้อความ error จากการ login
  const [message, setMessage] = useState("");

  // ดึง session ของผู้ใช้จาก NextAuth
  const { data: session } = useSession();

  // ใช้สำหรับ disable ปุ่มตอนกำลัง login
  const [loading, setLoading] = useState(false);

  // เก็บค่าฟอร์ม email และ password
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // เมื่อ session เปลี่ยน (เช่น login สำเร็จ)
  useEffect(() => {
    if (!session) return;

    if (session.user) {
      localStorage.setItem("username", session.user.name ?? "");

      if (session.user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [session, router]);

  // ฟังก์ชันสำหรับอัปเดตค่าจาก input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // อัปเดตค่าใน state ตามชื่อ field
    setForm({ ...form, [name]: value });
  };

  // ฟังก์ชัน submit form login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        callbackUrl: "/", // เพิ่มตรงนี้
      });

      console.log("signIn result:", res); // debug

      if (res?.error) {
        setMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
        return;
      }

      if (res?.ok) {
        // redirect ทันที ไม่รอ useSession
        router.replace(res.url || "/");
        return;
      }

      // fallback กันกรณีแปลก ๆ
      setMessage("เข้าสู่ระบบไม่สำเร็จ");
      setLoading(false);
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setLoading(false);
    }
  };

  // ฟังก์ชัน login ด้วย Google
  const handleGoogleLogin = async () => {
    // หลัง login เสร็จ redirect ไปหน้า home
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ส่วนซ้าย แสดงรูปภาพ (เฉพาะหน้าจอใหญ่) */}
      <div className="w-1/2 relative hidden md:block">
        <Image
          src="/register-map.png"
          alt="Map"
          width={900}
          height={800}
          quality={100}
          className="rounded-md object-cover"
          priority
        />
      </div>

      {/* ส่วนขวา เป็นฟอร์ม login */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <h2 className="text-2xl font-semibold text-center">Sign In</h2>

          {/* แสดง error message ถ้ามี */}
          {message && (
            <p className="text-center text-red-500 text-sm">{message}</p>
          )}

          {/* input email */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <AiOutlineMail size={20} />
            </span>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-2xl px-4 py-3 outline-none focus:border-[#D4A373] pl-10"
              required
            />
          </div>

          {/* input password */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <CiLock size={20} />
            </span>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-2xl px-4 py-3 outline-none focus:border-[#D4A373] pl-10"
              required
            />
          </div>

          {/* ปุ่ม login */}
          <button
            type="submit"
            className="w-full bg-[#D4A373] text-black font-semibold py-3 rounded-2xl hover:bg-[#FAEDCD] transition"
            disabled={loading} // disable ตอนกำลังโหลด
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* เส้นแบ่ง */}
          <div className="text-center text-sm text-gray-500">Or</div>

          {/* ปุ่ม login ด้วย Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FAEDCD] transition"
          >
            <FcGoogle size={20} />
            Sign in with Google
          </button>

          {/* ลิงก์ไปหน้า register */}
          <p className="text-center text-sm text-gray-600">
            No account yet?{" "}
            <a href="/register" className="text-black font-medium underline">
              Register.
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
