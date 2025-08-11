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
  const [message, setMessage] = useState("");
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (session?.user?.name) {
      console.log("ชื่อผู้ใช้:", session.user.name);
      localStorage.setItem("username", session.user.name); // ✅ เก็บใน localStorage
    }
  }, [session]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      setMessage(res.error);
      setLoading(false);
      return;
    }

    // ดึงข้อมูล session เพื่อเอาชื่อผู้ใช้
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      if (sessionData?.user?.name) {
        localStorage.setItem("username", sessionData.user.name);
      }
    } catch (err) {
      console.error("Error fetching session:", err);
    }

    // ล็อกอินสำเร็จ → ไปหน้า Home
    router.push("/");
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

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <h2 className="text-2xl font-semibold text-center">Sign In</h2>

          {message && (
            <p className="text-center text-red-500 text-sm">{message}</p>
          )}

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
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center text-sm text-gray-500">Or</div>

          <button
            type="button"
            onClick={async () => {
              const res = await signIn("google", { callbackUrl: "/" });
              if (!res?.error) {
                try {
                  const sessionRes = await fetch("/api/auth/session");
                  const sessionData = await sessionRes.json();
                  if (sessionData?.user?.name) {
                    localStorage.setItem("username", sessionData.user.name);
                  }
                } catch (err) {
                  console.error("Error fetching session:", err);
                }
              }
            }}
            className="w-full border py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FAEDCD] transition"
          >
            <FcGoogle size={20} />
            Sign in with Google
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
