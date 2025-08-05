"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { AiOutlineMail } from "react-icons/ai";
import { CiLock } from "react-icons/ci";
export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      if (!data.user || !data.user.name) {
        alert("API ไม่คืน user.name");
        setLoading(false);
        return;
      }
      localStorage.setItem("userName", data.user.name);
      alert("เข้าสู่ระบบสำเร็จ!");
      window.location.href = "/";
    } catch (err) {
      setMessage("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left side - Map image */}
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

      {/* Right side - Register form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <h2 className="text-2xl font-semibold text-center">Sign In</h2>
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
          <button
            type="submit"
            className="w-full bg-[#D4A373] text-black font-semibold py-3 rounded-2xl hover:bg-[#FAEDCD] transition"
          >
            Sign In
          </button>

          <div className="text-center text-sm text-gray-500">Or</div>

          <button
            type="button"
            className="w-full border py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FAEDCD] transition"
          >
            <FcGoogle size={20} />
            Sign up with Google
          </button>

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
